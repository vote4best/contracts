// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IRankifyInstance} from "../interfaces/IRankifyInstance.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {LibQuadraticVoting} from "./LibQuadraticVoting.sol";
import "hardhat/console.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SignedMath} from "@openzeppelin/contracts/utils/math/SignedMath.sol";

library LibRankify {
    using LibTBG for LibTBG.Instance;
    using LibTBG for uint256;
    using LibTBG for LibTBG.Settings;
    using LibTBG for LibTBG.State;
    using LibQuadraticVoting for LibQuadraticVoting.qVotingStruct;

    struct InstanceState {
        uint256 numGames;
        bool contractInitialized;
        CommonParams commonParams;
    }

    struct CommonParams {
        uint256 principalCost;
        uint96 principalTimeConstant;
        address gamePaymentToken;
        address rankTokenAddress;
        address beneficiary;
    }

    struct VoteHidden {
        bytes32 hash;
        bytes proof;
    }

    struct GameState {
        uint256 joinPrice;
        uint256 gamePrice;
        uint256 rank;
        address createdBy;
        uint256 numOngoingProposals;
        uint256 numPrevProposals;
        uint256 numCommitments;
        address[] additionalRanks;
        uint256 paymentsBalance;
        uint256 numVotesThisTurn;
        uint256 numVotesPrevTurn;
        LibQuadraticVoting.qVotingStruct voting;
        mapping(uint256 => string) ongoingProposals; //Previous Turn Proposals (These are being voted on)
        mapping(address => bytes32) proposalCommitmentHashes; //Current turn Proposal submission
        mapping(address => VoteHidden) votesHidden;
        mapping(address => bool) playerVoted;
    }

    /**
     * @dev Compares two strings for equality. `a` and `b` are the strings to compare.
     *
     * Returns:
     *
     * - `true` if the strings are equal, `false` otherwise.
     */
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    /**
     * @dev Returns the game storage for the given game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - The game storage for `gameId`.
     */
    function getGameState(uint256 gameId) internal view returns (GameState storage game) {
        bytes32 position = LibTBG.getGameDataStorage(gameId);
        assembly {
            game.slot := position
        }
    }

    /**
     * @dev Returns the Rankify InstanceSettings storage.
     *
     * Returns:
     *
     * - The instanceState storage.
     */
    function instanceState() internal pure returns (InstanceState storage contractState) {
        bytes32 position = LibTBG.getDataStorage();
        assembly {
            contractState.slot := position
        }
    }

    bytes32 internal constant _PROPOSAL_PROOF_TYPEHASH =
        keccak256("signProposalByGM(uint256 gameId,uint256 turn,bytes32 proposalNHash,string encryptedProposal)");
    bytes32 internal constant _VOTE_PROOF_TYPEHASH =
        keccak256("signVote(uint256 vote1,uint256 vote2,uint256 vote3,uint256 gameId,uint256 turn,bytes32 salt)");
    bytes32 internal constant _VOTE_SUBMIT_PROOF_TYPEHASH =
        keccak256("publicSignVote(uint256 gameId,uint256 turn,bytes32 vote1,bytes32 vote2,bytes32 vote3)");

    /**
     * @dev Ensures that the contract is initialized.
     *
     * Requirements:
     *
     * - The contract must be initialized.
     */
    function enforceIsInitialized() internal view {
        InstanceState storage settings = instanceState();
        require(settings.contractInitialized, "onlyInitialized");
    }


    /**
     * @dev Ensures that the game with the given ID exists. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     */
    function enforceGameExists(uint256 gameId) internal view {
        enforceIsInitialized();
        require(gameId.gameExists(), "game not found");
    }

    struct NewGameParams {
        uint256 gameId;
        uint256 gameRank;
        address creator;
        uint256 minPlayerCnt;
        uint256 maxPlayerCnt;
        uint256 voteCredits;
        address gameMaster;
        uint96 nTurns;
        uint128 minGameTime;
        uint128 timePerTurn;
        uint128 timeToJoin;
    }

    /**
     * @dev Creates a new game with the given parameters. `gameId` is the ID of the new game. `gameMaster` is the address of the game master. `gameRank` is the rank of the game. `creator` is the address of the creator of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must not already exist.
     * - `gameRank` must not be 0.
     * - If the game price is not 0, the `creator` must have approved this contract to transfer the game price amount of the game payment token on their behalf.
     *
     * Modifies:
     *
     * - Creates a new game with `gameId`.
     * - Transfers the game price amount of the game payment token from `creator` to this contract.
     * - Sets the payments balance of the game to the game price.
     * - Sets the creator of the game to `creator`.
     * - Increments the number of games.
     * - Sets the rank of the game to `gameRank`.
     * - Mints new rank tokens.
     */
    function newGame(NewGameParams memory params) internal {
        enforceIsInitialized();
        CommonParams storage commonParams = instanceState().commonParams;

        require(
            commonParams.principalTimeConstant % params.nTurns == 0,
            IRankifyInstance.NoDivisionReminderAllowed(commonParams.principalTimeConstant, params.nTurns)
        );
        require(
            commonParams.principalTimeConstant % params.nTurns == 0,
            IRankifyInstance.NoDivisionReminderAllowed(commonParams.principalTimeConstant, params.minGameTime)
        );
        require(
            params.minGameTime % params.nTurns == 0,
            IRankifyInstance.NoDivisionReminderAllowed(params.nTurns, params.minGameTime)
        );
        require(params.minGameTime > 0, "LibRankify::newGame->Min game time zero");
        require(params.nTurns > 2, IRankifyInstance.invalidTurnCount(params.nTurns));

        LibTBG.Settings memory newSettings = LibTBG.Settings({
            timePerTurn: params.timePerTurn,
            maxPlayerCnt: params.maxPlayerCnt,
            minPlayerCnt: params.minPlayerCnt,
            timeToJoin: params.timeToJoin,
            maxTurns: params.nTurns,
            voteCredits: params.voteCredits,
            gameMaster: params.gameMaster,
            implementationStoragePointer: bytes32(0)
        });

        InstanceState storage state = instanceState();

        params.gameId.createGame(newSettings); // This will enforce game does not exist yet
        GameState storage game = getGameState(params.gameId);
        game.voting = LibQuadraticVoting.precomputeValues(params.voteCredits, params.maxPlayerCnt);
        require(
            SignedMath.abs(int256(uint256(params.minGameTime)) - int256(uint256(commonParams.principalTimeConstant))) <
                uint256(commonParams.principalTimeConstant) * 16,
            "Min game time out of bounds"
        );
        uint256 principalGamePrice = Math.mulDiv(
            uint256(commonParams.principalCost),
            uint256(commonParams.principalTimeConstant),
            uint256(params.minGameTime)
        );

        IERC20(commonParams.gamePaymentToken).transferFrom(
            params.creator,
            commonParams.beneficiary,
            principalGamePrice
        );

        require(params.gameRank != 0, IRankifyInstance.RankNotSpecified());

        game.createdBy = params.creator;
        state.numGames += 1;
        game.rank = params.gameRank;

        IRankToken rankTokenContract = IRankToken(state.commonParams.rankTokenAddress);
        rankTokenContract.mint(address(this), 1, params.gameRank + 1, "");
    }

    /**
     * @dev Ensures that the candidate is the creator of the game with the given ID. `gameId` is the ID of the game. `candidate` is the address of the candidate.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - `candidate` must be the creator of the game.
     */
    function enforceIsGameCreator(uint256 gameId, address candidate) internal view {
        enforceGameExists(gameId);
        GameState storage game = getGameState(gameId);
        require(game.createdBy == candidate, "Only game creator");
    }

    /**
     * @dev Ensures that the candidate is the game master of the game with the given ID. `gameId` is the ID of the game. `candidate` is the address of the candidate.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - `candidate` must be the game master of the game.
     */
    function enforceIsGM(uint256 gameId, address candidate) internal view {
        enforceGameExists(gameId);
        require(gameId.getGM() == candidate, "Only game master");
    }

    /**
     * @dev Locks the rank token of the player. `player` is the address of the player. `gameRank` is the rank of the game. `rankTokenAddress` is the address of the rank token contract.
     *
     * Requirements:
     *
     * - `RankTokenAddress` must support `IRankToken` interface
     *
     * Modifies:
     *
     * - Locks `gameRank` rank of `player` in the rank token contract.
     */
    function _fulfillRankRq(address player, uint256 gameRank, address rankTokenAddress) private {
        IRankToken rankToken = IRankToken(rankTokenAddress);
        rankToken.lock(player, gameRank, 1);
    }

    /**
     * @dev Allows a player to join a game. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - If the join game price is not 0, the `player` must have approved this contract to transfer the join game price amount of the game payment token on their behalf.
     *
     * Modifies:
     *
     * - Transfers the join game price amount of the game payment token from `player` to this contract.
     * - Increases the payments balance of the game by the join game price.
     * - Adds `player` to the game.
     */
    function joinGame(uint256 gameId, address player) internal {
        enforceGameExists(gameId);
        fulfillRankRq(gameId, player);
        GameState storage game = getGameState(gameId);
        InstanceState storage state = instanceState();
        if (game.joinPrice != 0) {
            IERC20(state.commonParams.gamePaymentToken).transferFrom(player, address(this), game.joinPrice);
            game.paymentsBalance += game.joinPrice;
        }
        gameId.addPlayer(player);
    }

    /**
     * @dev Closes the game with the given ID and transfers the game's balance to the beneficiary. `gameId` is the ID of the game. `beneficiary` is the address to transfer the game's balance to. `playersGameEndedCallback` is a callback function to call for each player when the game ends.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Emits rank rewards for the game.
     * - Removes and unlocks each player from the game.
     * - Calls `playersGameEndedCallback` for each player.
     * - Transfers the game's balance to `beneficiary`.
     *
     * Returns:
     *
     * - The final scores of the game.
     */
    function closeGame(
        uint256 gameId,
        function(uint256, address) playersGameEndedCallback
    ) internal returns (uint256[] memory) {
        enforceGameExists(gameId);
        (, uint256[] memory finalScores) = gameId.getScores();
        address[] memory players = gameId.getPlayers();
        for (uint256 i = 0; i < players.length; ++i) {
            removeAndUnlockPlayer(gameId, players[i]);
            playersGameEndedCallback(gameId, players[i]);
        }
        emitRankRewards(gameId, gameId.getLeaderBoard());
        GameState storage game = LibRankify.getGameState(gameId);
        InstanceState storage state = instanceState();
        IERC20(state.commonParams.gamePaymentToken).transfer(
            state.commonParams.beneficiary,
            (game.joinPrice * players.length) + game.gamePrice
        );
        return finalScores;
    }

    /**
     * @dev Allows a player to quit a game. `gameId` is the ID of the game. `player` is the address of the player. `slash` is a boolean indicating whether to slash the player's payment refund. `onPlayerLeftCallback` is a callback function to call when the player leaves.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - If the join game price is not 0, transfers a refund to `player` and decreases the game's payments balance by the refund amount.
     * - Removes and unlocks `player` from the game.
     * - Calls `onPlayerLeftCallback` for `player`.
     */
    function quitGame(
        uint256 gameId,
        address player,
        bool slash,
        function(uint256, address) onPlayerLeftCallback
    ) internal {
        GameState storage state = getGameState(gameId);
        InstanceState storage instance = instanceState();
        if (state.joinPrice != 0) {
            uint256 divideBy = slash ? 2 : 1;
            uint256 paymentRefund = state.joinPrice / divideBy;
            GameState storage game = getGameState(gameId);
            game.paymentsBalance -= paymentRefund;
            IERC20(instance.commonParams.gamePaymentToken).transfer(player, paymentRefund);
        }
        removeAndUnlockPlayer(gameId, player); // this will throw if game has started or doesnt exist
        onPlayerLeftCallback(gameId, player);
    }

    /**
     * @dev Cancels the game with the given ID, refunds half of the game's payment to the game creator, and transfers the remaining balance to the beneficiary. `gameId` is the ID of the game. `onPlayerLeftCallback` is a callback function to call for each player when they leave. `beneficiary` is the address to transfer the remaining balance to.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Calls `quitGame` for each player in the game.
     * - Transfers half of the game's payment to the game creator.
     * - Decreases the game's payments balance by the refund amount.
     * - Transfers the remaining balance of the game to `beneficiary`.
     * - Deletes the game.
     */ function cancelGame(
        uint256 gameId,
        function(uint256, address) onPlayerLeftCallback
    ) internal {
        // Cancel the game for each player
        address[] memory players = gameId.getPlayers();
        for (uint256 i = 0; i < players.length; ++i) {
            quitGame(gameId, players[i], false, onPlayerLeftCallback); //this will throw if game has started or doesnt exist
        }

        // Refund payment to the game creator
        GameState storage game = getGameState(gameId);
        InstanceState storage instance = instanceState();
        uint256 paymentRefund = game.gamePrice / 2;
        IERC20(instance.commonParams.gamePaymentToken).transfer(game.createdBy, paymentRefund);
        game.paymentsBalance -= paymentRefund;

        // Transfer remaining payments balance to the beneficiary
        IERC20(instance.commonParams.gamePaymentToken).transfer(
            instance.commonParams.beneficiary,
            game.paymentsBalance
        );
        game.paymentsBalance = 0;

        // Delete the game
        gameId.deleteGame();
    }

    /**
     * @dev Fulfills the rank requirement for a player to join a game. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Modifies:
     *
     * - Locks the rank token(s) of `player` in the rank token contract.
     * - If the game has additional ranks, locks the additional ranks of `player` in the respective rank token contracts.
     */
    function fulfillRankRq(uint256 gameId, address player) internal {
        InstanceState storage instance = instanceState();
        GameState storage game = getGameState(gameId);
        if (game.rank > 1) {
            _fulfillRankRq(player, game.rank, instance.commonParams.rankTokenAddress);
            for (uint256 i = 0; i < game.additionalRanks.length; ++i) {
                _fulfillRankRq(player, game.rank, game.additionalRanks[i]);
            }
        }
    }

    /**
     * @dev Emits rank rewards to the top three addresses in the leaderboard. `gameId` is the ID of the game. `leaderboard` is an array of addresses representing the leaderboard sorted in descendign order. `rankTokenAddress` is the address of the rank token contract.
     *
     * Modifies:
     *
     * - Transfers rank tokens from this contract to the top three addresses in the leaderboard.
     */
    function emitRankReward(uint256 gameId, address[] memory leaderboard, address rankTokenAddress) private {
        GameState storage game = getGameState(gameId);
        IRankToken rankTokenContract = IRankToken(rankTokenAddress);
        rankTokenContract.burn(leaderboard[0], game.rank, 1);
        rankTokenContract.safeTransferFrom(address(this), leaderboard[0], game.rank + 1, 1, "");
    }

    /**
     * @dev Emits rank rewards to the top addresses in the leaderboard for each rank in the game. `gameId` is the ID of the game. `leaderboard` is an array of addresses representing the leaderboard.
     *
     * Modifies:
     *
     * - Calls `emitRankReward` for the main rank and each additional rank in the game.
     */
    function emitRankRewards(uint256 gameId, address[] memory leaderboard) internal {
        GameState storage game = getGameState(gameId);
        InstanceState storage instance = LibRankify.instanceState();
        emitRankReward(gameId, leaderboard, instance.commonParams.rankTokenAddress);
        for (uint256 i = 0; i < game.additionalRanks.length; ++i) {
            emitRankReward(gameId, leaderboard, game.additionalRanks[i]);
        }
    }

    /**
     * @dev Releases a rank token for a player with a specific game rank. `player` is the address of the player. `gameRank` is the game rank of the player. `rankTokenAddress` is the address of the rank token contract.
     *
     * Modifies:
     *
     * - Unlocks one rank token of `gameRank` for `player` in the rank token contract.
     */
    function _releaseRankToken(address player, uint256 gameRank, address rankTokenAddress) private {
        IRankToken rankToken = IRankToken(rankTokenAddress);
        rankToken.unlock(player, gameRank, 1);
    }

    /**
     * @dev Removes a player from a game and unlocks their rank tokens. `gameId` is the ID of the game. `player` is the address of the player to be removed.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Removes `player` from the game.
     * - If the game rank is greater than 1, unlocks the game rank token for `player` in the rank token contract and unlocks each additional rank token for `player` in the respective rank token contracts.
     */
    function removeAndUnlockPlayer(uint256 gameId, address player) internal {
        enforceGameExists(gameId);
        gameId.removePlayer(player); //This will throw if game is in the process
        InstanceState storage instance = instanceState();
        GameState storage game = getGameState(gameId);
        if (game.rank > 1) {
            _releaseRankToken(player, game.rank, instance.commonParams.rankTokenAddress);
            for (uint256 i = 0; i < game.additionalRanks.length; ++i) {
                _releaseRankToken(player, game.rank, game.additionalRanks[i]);
            }
        }
    }

    /**
     * @dev Tries to make a move for a player in a game. `gameId` is the ID of the game. `player` is the address of the player.
     * The "move" is considered to be a state when player has made all actions he could in the given turn.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - If the player has not voted and a vote is expected, or if the player has not made a proposal and a proposal is expected, does not make a move and returns `false`.
     * - Otherwise, makes a move for `player` and returns `true`.
     */
    function tryPlayerMove(uint256 gameId, address player) internal returns (bool) {
        uint256 turn = gameId.getTurn();
        GameState storage game = getGameState(gameId);
        bool expectVote = true;
        bool expectProposal = true;
        if (turn == 1) expectVote = false; //Dont expect votes at firt turn
        // else if (gameId.isLastTurn()) expectProposal = false; // For now easiest solution is to keep collecting proposals as that is less complicated boundry case
        if (game.numPrevProposals < game.voting.minQuadraticPositions) expectVote = false; // If there is not enough proposals then round is skipped votes cannot be filled
        bool madeMove = true;
        if (expectVote && !game.playerVoted[player]) madeMove = false;
        if (expectProposal && game.proposalCommitmentHashes[player] == "") madeMove = false;
        if (madeMove) gameId.playerMove(player);
        return madeMove;
    }

    /**
     * @dev Calculates the scores using a quadratic formula based on the revealed votes and proposer indices. `gameId` is the ID of the game. `votesRevealed` is an array of revealed votes. `proposerIndices` is an array of proposer indices that links proposals to index in getPlayers().
     *
     * Returns:
     *
     * - An array of updated scores for each player.
     * - An array of scores calculated for the current round.
     */
    function calculateScoresQuadratic(
        uint256 gameId,
        uint256[][] memory votesRevealed,
        uint256[] memory proposerIndices
    ) internal returns (uint256[] memory, uint256[] memory) {
        address[] memory players = gameId.getPlayers();
        uint256[] memory scores = new uint256[](players.length);
        bool[] memory playerVoted = new bool[](players.length);
        GameState storage game = getGameState(gameId);
        // Convert mappiing to array to pass it to libQuadratic
        for (uint256 i = 0; i < players.length; ++i) {
            playerVoted[i] = game.playerVoted[players[i]];
        }
        uint256[] memory roundScores = game.voting.computeScoresByVPIndex(
            votesRevealed,
            playerVoted,
            game.voting.maxQuadraticPoints,
            proposerIndices.length
        );
        for (uint256 playerIdx = 0; playerIdx < players.length; playerIdx++) {
            //for each player
            if (proposerIndices[playerIdx] < players.length) {
                //if player proposal exists
                scores[playerIdx] = gameId.getScore(players[playerIdx]) + roundScores[playerIdx];
                gameId.setScore(players[playerIdx], scores[playerIdx]);
            } else {
                //Player did not propose
            }
        }
        return (scores, roundScores);
    }
}
