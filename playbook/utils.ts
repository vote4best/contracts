import aes from 'crypto-js/aes';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  Rankify,
  MockERC1155,
  MockERC20,
  MockERC721,
  RankToken,
  MAODistribution,
  DAODistributor,
  ArguableVotingTournament,
} from '../types';
import { BigNumber, BigNumberish, BytesLike, Wallet, ethers, utils } from 'ethers';
// @ts-ignore
import { assert } from 'console';
import { Deployment } from 'hardhat-deploy/types';
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDiscussionForTurn } from './instance/discussionTopics';
import { json } from 'stream/consumers';
export const RANKIFY_INSTANCE_CONTRACT_NAME = 'RANKIFY_INSTANCE_NAME';
export const RANKIFY_INSTANCE_CONTRACT_VERSION = '0.0.1';
export const RInstance_TIME_PER_TURN = 60 * 60 * 24;
export const RInstance_MAX_PLAYERS = 6;
export const RInstance_MIN_PLAYERS = 5;
export const RInstance_MAX_TURNS = 5;
export const RInstance_TIME_TO_JOIN = '200';
export const RInstance_GAME_PRICE = ethers.utils.parseEther('0.001');
export const RInstance_JOIN_GAME_PRICE = ethers.utils.parseEther('0.001');
export const RInstance_NUM_WINNERS = 3;
export const RInstance_VOTE_CREDITS = 14;
export const RInstance_SUBJECT = 'Best Music on youtube';
export interface SignerIdentity {
  name: string;
  id: string;
  wallet: Wallet | SignerWithAddress;
}
export interface AdrSetupResult {
  contractDeployer: SignerIdentity;
  player1: SignerIdentity;
  player2: SignerIdentity;
  player3: SignerIdentity;
  player4: SignerIdentity;
  player5: SignerIdentity;
  player6: SignerIdentity;
  player7: SignerIdentity;
  player8: SignerIdentity;
  player9: SignerIdentity;
  player10: SignerIdentity;
  player11: SignerIdentity;
  player12: SignerIdentity;
  player13: SignerIdentity;
  player14: SignerIdentity;
  player15: SignerIdentity;
  player16: SignerIdentity;
  player17: SignerIdentity;
  player18: SignerIdentity;
  maliciousActor1: SignerIdentity;
  maliciousActor2: SignerIdentity;
  maliciousActor3: SignerIdentity;
  gameCreator1: SignerIdentity;
  gameCreator2: SignerIdentity;
  gameCreator3: SignerIdentity;
  gameMaster1: SignerIdentity;
  gameMaster2: SignerIdentity;
  gameMaster3: SignerIdentity;
  gameOwner: SignerIdentity;
}

export interface EnvSetupResult {
  rankifyToken: Rankify;
  arguableVotingTournamentDistribution: ArguableVotingTournament;
  rankTokenBase: RankToken;
  mockERC20: MockERC20;
  mockERC1155: MockERC1155;
  mockERC721: MockERC721;
  maoDistribution: MAODistribution;
  distributor: DAODistributor;
}
export const addPlayerNameId = (idx: any) => {
  return { name: `player-${idx}`, id: `player-${idx}-id` };
};

export const setupAddresses = async (
  getNamedAccounts: () => Promise<{
    [name: string]: string;
  }>,
  _eth: typeof import('ethers/lib/ethers') & HardhatEthersHelpers,
  hre: HardhatRuntimeEnvironment,
): Promise<AdrSetupResult> => {
  const { ethers } = hre;
  const [
    ,
    ,
    ,
    //Using first ones in hardhat deploy scripts
    _player1,
    _player2,
    _player3,
    _player4,
    _player5,
    _player6,
    _player7,
    _player8,
    _player9,
    _player10,
    _player11,
    _player12,
    _player13,
    _player14,
    _player15,
    _player16,
    _player17,
  ] = await ethers.getSigners();

  const { deployer, owner, gameMaster: _gameMaster1 } = await getNamedAccounts();

  const createRandomIdentityAndSeedEth = async (name: string) => {
    let newWallet = await _eth.Wallet.createRandom();
    newWallet = newWallet.connect(_eth.provider);
    await _player1.sendTransaction({
      to: newWallet.address,
      value: ethers.utils.parseEther('10'),
    });

    const newIdentity: SignerIdentity = {
      wallet: newWallet,
      name: name,
      id: name + '-id',
    };
    return newIdentity;
  };

  //   const gameCreator1 = await createRandomIdentityAndSeedEth('gameCreator1');
  const gameCreator2 = await createRandomIdentityAndSeedEth('gameCreator2');
  const gameCreator3 = await createRandomIdentityAndSeedEth('gameCreator3');
  const maliciousActor1 = await createRandomIdentityAndSeedEth('maliciousActor');
  const gameMaster1: SignerIdentity = {
    wallet: await hre.ethers.getSigner(_gameMaster1),
    name: 'gameMaster1',
    id: 'gameMaster1-id',
  };
  const gameMaster2 = await createRandomIdentityAndSeedEth('GM2');
  const gameMaster3 = await createRandomIdentityAndSeedEth('GM3');
  const maliciousActor2 = await createRandomIdentityAndSeedEth('MaliciousActor2');
  const maliciousActor3 = await createRandomIdentityAndSeedEth('MaliciousActor3');
  const player18 = await createRandomIdentityAndSeedEth('player18');

  const gameCreator1: SignerIdentity = {
    wallet: await hre.ethers.getSigner(deployer),
    name: 'gameCreator1',
    id: 'gameCreator1-id',
  };

  const contractDeployer: SignerIdentity = {
    wallet: await hre.ethers.getSigner(deployer),
    name: 'contractDeployer',
    id: 'contractDeployer-id',
  };

  const gameOwner: SignerIdentity = {
    wallet: await hre.ethers.getSigner(owner),
    name: 'gameOwner',
    id: 'gameOwner-id',
  };
  const player1: SignerIdentity = {
    wallet: _player1,
    name: 'player1',
    id: 'player1-id',
  };
  const player2: SignerIdentity = {
    wallet: _player2,
    name: 'player2',
    id: 'player2-id',
  };
  const player3: SignerIdentity = {
    wallet: _player3,
    name: 'player3',
    id: 'player3-id',
  };
  const player4: SignerIdentity = {
    wallet: _player4,
    name: 'player4',
    id: 'player4-id',
  };
  const player5: SignerIdentity = {
    wallet: _player5,
    name: 'player5',
    id: 'player5-id',
  };
  const player6: SignerIdentity = {
    wallet: _player6,
    name: 'player6',
    id: 'player6-id',
  };
  const player7: SignerIdentity = {
    wallet: _player7,
    name: 'player7',
    id: 'player7-id',
  };
  const player8: SignerIdentity = {
    wallet: _player8,
    name: 'player8',
    id: 'player8-id',
  };
  const player9: SignerIdentity = {
    wallet: _player9,
    name: 'player9',
    id: 'player9-id',
  };
  const player10: SignerIdentity = {
    wallet: _player10,
    name: 'player10',
    id: 'player10-id',
  };
  const player11: SignerIdentity = {
    wallet: _player11,
    name: 'player11',
    id: 'player11-id',
  };
  const player12: SignerIdentity = {
    wallet: _player12,
    name: 'player12',
    id: 'player12-id',
  };
  const player13: SignerIdentity = {
    wallet: _player13,
    name: 'player13',
    id: 'player13-id',
  };
  const player14: SignerIdentity = {
    wallet: _player14,
    name: 'player14',
    id: 'player14-id',
  };
  const player15: SignerIdentity = {
    wallet: _player15,
    name: 'player15',
    id: 'player15-id',
  };
  const player16: SignerIdentity = {
    wallet: _player16,
    name: 'player16',
    id: 'player16-id',
  };
  const player17: SignerIdentity = {
    wallet: _player17,
    name: 'player17',
    id: 'player17-id',
  };

  return {
    contractDeployer,
    player1,
    player2,
    player3,
    player4,
    player5,
    player6,
    player7,
    player8,
    player9,
    player10,
    player11,
    player12,
    player13,
    player14,
    player15,
    player16,
    player17,
    player18,
    maliciousActor1,
    gameCreator1,
    gameCreator2,
    gameCreator3,
    gameMaster1,
    gameMaster2,
    gameMaster3,
    maliciousActor2,
    maliciousActor3,
    gameOwner,
  };
};

const baseFee = 1 * 10 ** 18;

export const RInstanceSettings = {
  RInstance_TIME_PER_TURN,
  RInstance_MAX_PLAYERS,
  RInstance_MIN_PLAYERS,
  RInstance_MAX_TURNS,
  RInstance_TIME_TO_JOIN,
  RInstance_GAME_PRICE,
  RInstance_JOIN_GAME_PRICE,
  RInstance_NUM_WINNERS,
  RInstance_VOTE_CREDITS,
  RInstance_SUBJECT,
  PRINCIPAL_TIME_CONSTANT: 3600,
  RInstance_MIN_GAME_TIME: 360,
  PRINCIPAL_COST: utils.parseEther('1'),
  // RInstance_NUM_ACTIONS_TO_TAKE,
};

export const setupTest = async (hre: HardhatRuntimeEnvironment) => {
  const deployments = hre.deployments;
  await hre.run('deploy', {
    tags: 'MAO',
    network: 'localhost',
  });
  const { getNamedAccounts } = hre;
  const { ethers: _eth } = hre;
  //   await deployments.fixture(['MAO'], { keepExistingDeployments: true });
  const adr = await setupAddresses(getNamedAccounts, _eth, hre);
  const { deployer, owner } = await hre.getNamedAccounts();

  await adr.contractDeployer.wallet.sendTransaction({
    to: deployer,
    value: _eth.utils.parseEther('1'),
  });
  await adr.contractDeployer.wallet.sendTransaction({
    to: owner,
    value: _eth.utils.parseEther('1'),
  });
  const MockERC20F = await _eth.getContractFactory('MockERC20', adr.contractDeployer.wallet);
  const mockERC20 = (await MockERC20F.deploy('Mock ERC20', 'MCK20', adr.contractDeployer.wallet.address)) as MockERC20;
  await mockERC20.deployed();

  const MockERC1155F = await _eth.getContractFactory('MockERC1155', adr.contractDeployer.wallet);
  const mockERC1155 = (await MockERC1155F.deploy('MOCKURI', adr.contractDeployer.wallet.address)) as MockERC1155;
  await mockERC1155.deployed();

  const MockERC721F = await _eth.getContractFactory('MockERC721', adr.contractDeployer.wallet);
  const mockERC721 = (await MockERC721F.deploy(
    'Mock ERC721',
    'MCK721',
    adr.contractDeployer.wallet.address,
  )) as MockERC721;
  await mockERC721.deployed();
  const env = await setupEnvironment({
    hre,
    distributor: await deployments.get('DAODistributor'),
    mao: await deployments.get('MAODistribution'),
    RankifyToken: await deployments.get('Rankify'),
    RankTokenBase: await deployments.get('RankToken'),
    // RankifyInstance: await deployments.get('RankifyInstance'),
    arguableVotingTournamentDistribution: await deployments.get('ArguableVotingTournament'),
    mockERC20: mockERC20,
    mockERC721: mockERC721,
    mockERC1155: mockERC1155,
    adr,
  });
  const { ethers } = hre;
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.gameCreator1.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.gameCreator2.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.gameCreator3.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player1.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player2.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player3.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player4.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player5.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player6.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player7.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player8.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player9.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player10.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.maliciousActor1.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.maliciousActor2.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.maliciousActor3.wallet.address, ethers.utils.parseEther('1000000'));
  //   await env.rankifyToken
  //     .connect(adr.gameCreator1.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.gameCreator2.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.gameCreator3.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player1.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player2.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player3.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player4.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player5.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player6.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player7.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player8.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player9.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player10.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);

  //   await env.rankifyToken
  //     .connect(adr.maliciousActor1.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.maliciousActor2.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.maliciousActor3.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);

  return {
    adr,
    env,
  };
};
// export const setupTest = () => setupTest();
export const setupEnvironment = async (setup: {
  hre: HardhatRuntimeEnvironment;
  distributor: Deployment;
  mao: Deployment;
  RankifyToken: Deployment;
  RankTokenBase: Deployment;
  //   RankifyInstance: Deployment;
  mockERC20: MockERC20;
  mockERC721: MockERC721;
  mockERC1155: MockERC1155;
  adr: AdrSetupResult;
  arguableVotingTournamentDistribution: Deployment;
}): Promise<EnvSetupResult> => {
  const { ethers } = setup.hre;
  const rankTokenBase = (await ethers.getContractAt(setup.RankTokenBase.abi, setup.RankTokenBase.address)) as RankToken;
  const rankifyToken = (await ethers.getContractAt(setup.RankifyToken.abi, setup.RankifyToken.address)) as Rankify;
  //   const rankifyInstance = (await ethers.getContractAt(
  //     setup.RankifyInstance.abi,
  //     setup.RankifyInstance.address,
  //   )) as RankifyDiamondInstance;

  const maoDistribution = (await ethers.getContractAt(setup.mao.abi, setup.mao.address)) as MAODistribution;
  const distributor = (await ethers.getContractAt(setup.distributor.abi, setup.distributor.address)) as DAODistributor;

  const arguableVotingTournamentDistribution = (await ethers.getContractAt(
    setup.arguableVotingTournamentDistribution.abi,
    setup.arguableVotingTournamentDistribution.address,
  )) as ArguableVotingTournament;

  return {
    maoDistribution,
    distributor,
    rankifyToken,
    // rankifyInstance,
    rankTokenBase,
    mockERC1155: setup.mockERC1155,
    mockERC20: setup.mockERC20,
    mockERC721: setup.mockERC721,
    arguableVotingTournamentDistribution,
  };
};

interface ReferrerMessage {
  referrerAddress: string;
}
interface RegisterMessage {
  name: BytesLike;
  id: BytesLike;
  domainName: BytesLike;
  deadline: BigNumber;
  nonce: BigNumber;
}

type signatureMessage = ReferrerMessage | RegisterMessage;

export async function mineBlocks(count: any, hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  for (let i = 0; i < count; i += 1) {
    await ethers.provider.send('evm_mine', []);
  }
}

// interface VoteSubmittion {
//   gameId: string;
//   voterHidden: string;
//   votes: string[3];
//   proof: string;
// }

// const mockVote = ({
//   voter,
// }: {
//   voter: SignerIdentity;
//   gm: SignerIdentity;
//   voteText: string;
// }): VoteSubmittion => {
//   return

// };

export interface ProposalParams {
  gameId: BigNumberish;
  encryptedProposal: string;
  commitmentHash: BytesLike;
  proposer: string;
}

export interface ProposalSubmission {
  proposal: string;
  params: ProposalParams;
  proposerSignerId: SignerIdentity;
}

interface VoteMessage {
  vote1: BigNumberish;
  vote2: BigNumberish;
  vote3: BigNumberish;
  gameId: BigNumberish;
  turn: BigNumberish;
  salt: BytesLike;
}
interface PublicVoteMessage {
  vote1: BytesLike;
  vote2: BytesLike;
  vote3: BytesLike;
  gameId: BigNumberish;
  turn: BigNumberish;
}
const VoteTypes = {
  signVote: [
    {
      type: 'uint256',
      name: 'vote1',
    },
    {
      type: 'uint256',
      name: 'vote2',
    },
    {
      type: 'uint256',
      name: 'vote3',
    },
    {
      type: 'uint256',
      name: 'gameId',
    },
    {
      type: 'uint256',
      name: 'turn',
    },
    {
      type: 'bytes32',
      name: 'salt',
    },
  ],
};

const publicVoteTypes = {
  publicSignVote: [
    {
      type: 'uint256',
      name: 'gameId',
    },
    {
      type: 'uint256',
      name: 'turn',
    },
    {
      type: 'uint256',
      name: 'vote1',
    },
    {
      type: 'uint256',
      name: 'vote2',
    },
    {
      type: 'uint256',
      name: 'vote3',
    },
  ],
};

export const signVoteMessage = async (
  message: VoteMessage,
  verifierAddress: string,
  signer: SignerIdentity,
  hre: HardhatRuntimeEnvironment,
) => {
  const { ethers } = hre;
  let { chainId } = await ethers.provider.getNetwork();

  const domain = {
    name: RANKIFY_INSTANCE_CONTRACT_NAME,
    version: RANKIFY_INSTANCE_CONTRACT_VERSION,
    chainId,
    verifyingContract: verifierAddress,
  };
  const s = await signer.wallet._signTypedData(domain, VoteTypes, {
    ...message,
  });
  return s;
};

export const signPublicVoteMessage = async (
  message: PublicVoteMessage,
  verifierAddress: string,
  signer: SignerIdentity,
  hre: HardhatRuntimeEnvironment,
) => {
  const { ethers } = hre;
  let { chainId } = await ethers.provider.getNetwork();

  const domain = {
    name: RANKIFY_INSTANCE_CONTRACT_NAME,
    version: RANKIFY_INSTANCE_CONTRACT_VERSION,
    chainId,
    verifyingContract: verifierAddress,
  };
  const s = await signer.wallet._signTypedData(domain, publicVoteTypes, {
    ...message,
  });
  return s;
};

const MOCK_SECRET = '123456';

export const getTurnSalt = ({ gameId, turn }: { gameId: BigNumberish; turn: BigNumberish }) => {
  return utils.solidityKeccak256(['string', 'uint256', 'uint256'], [MOCK_SECRET, gameId, turn]);
};

export const getTurnPlayersSalt = ({
  gameId,
  turn,
  player,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  player: string;
}) => {
  return utils.solidityKeccak256(['address', 'bytes32'], [player, getTurnSalt({ gameId, turn })]);
};

export const mockVote = async ({
  voter,
  gm,
  gameId,
  turn,
  vote,
  verifierAddress,
}: {
  voter: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: SignerIdentity;
  vote: BigNumberish[];
  verifierAddress: string;
}): Promise<{
  // proof: string;
  vote: BigNumberish[];
  voteHidden: string;
  // publicSignature: string;
}> => {
  const playerSalt = getTurnPlayersSalt({
    gameId,
    turn,
    player: voter.wallet.address,
  });

  const message = {
    vote: vote,
    gameId,
    turn,
    salt: playerSalt,
  };

  const voteHidden: string = utils.solidityKeccak256(['string[]', 'bytes32'], [vote, playerSalt]);
  // const publicMessage = {
  //   vote1: voteHidden[0],
  //   vote2: voteHidden[1],
  //   vote3: voteHidden[2],
  //   gameId,
  //   turn,
  // };
  // const proof = await signVoteMessage(message, verifierAddress, gm);
  // const publicSignature = await signPublicVoteMessage(publicMessage, verifierAddress, gm);
  return { vote, voteHidden };
};
export const getPlayers = (
  adr: AdrSetupResult,
  numPlayers: number,
  offset?: number,
): [SignerIdentity, SignerIdentity, ...SignerIdentity[]] => {
  const _offset = offset ?? 0;
  let players: SignerIdentity[] = [];
  for (let i = 1; i < numPlayers + 1; i++) {
    assert(i + _offset < 19, 'Such player does not exist in adr generation');
    let name = `player${i + _offset}` as any as keyof AdrSetupResult;
    players.push(adr[`${name}`]);
  }
  return players as any as [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
};

export type MockVotes = Array<{
  // proof: string;
  vote: BigNumberish[];
  voteHidden: string;
  // publicSignature: string;
}>;

function shuffle(array: any[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

export const mockVotes = async ({
  gm,
  gameId,
  turn,
  verifierAddress,
  players,
  distribution,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: SignerIdentity;
  verifierAddress: string;
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
  distribution: 'ftw' | 'semiUniform' | 'equal' | 'zeros';
}): Promise<MockVotes> => {
  const votes: Array<{
    // proof: string;
    vote: BigNumberish[];
    voteHidden: string;
    // publicSignature: string;
  }> = [];
  for (let k = 0; k < players.length; k++) {
    let creditsLeft = RInstance_VOTE_CREDITS;
    let playerVote: BigNumberish[] = [];
    if (distribution == 'zeros') {
      playerVote = players.map(() => 0);
    }
    if (distribution == 'ftw') {
      playerVote = players.map((proposer, idx) => {
        if (k !== idx) {
          const voteWeight = Math.floor(Math.sqrt(creditsLeft));
          creditsLeft -= voteWeight * voteWeight;
          return voteWeight;
        } else {
          return 0;
        }
      });
    } else if (distribution == 'semiUniform') {
      const votesToDistribute = players.map(() => {
        const voteWeight = Math.floor(Math.sqrt(creditsLeft));
        creditsLeft -= voteWeight * voteWeight;
        return voteWeight;
      });
      let votesDistributed = [];
      do {
        votesDistributed = shuffle(votesToDistribute);
      } while (votesDistributed[k] !== 0);
      playerVote = [...votesDistributed];
    } else if (distribution == 'equal') {
      const lowSide = k >= players.length / 2 ? false : true;
      let _votes = players.map((proposer, idx) => {
        const voteWeight = Math.floor(Math.sqrt(creditsLeft));
        if (players.length % 2 !== 0 && k !== Math.floor(players.length / 2)) {
          //Just skipp odd voter
          creditsLeft -= voteWeight * voteWeight;
          return voteWeight;
        } else return 0;
      });
      playerVote = lowSide ? [..._votes.reverse()] : [..._votes];
      console.assert(playerVote[k] == 0);
    }

    const { vote, voteHidden } = await mockVote({
      voter: players[k],
      gameId,
      turn,
      gm,
      verifierAddress,
      vote: playerVote,
    });
    votes[k] = { vote, voteHidden: utils.hashMessage(JSON.stringify(voteHidden)) };
  }
  return votes;
};

export const mockProposalSecrets = async ({
  gm,
  proposer,
  gameId,
  turn,
}: {
  gm: SignerIdentity;
  proposer: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
}): Promise<ProposalSubmission> => {
  const _gmW = gm.wallet as Wallet;
  const proposal = getDiscussionForTurn(Number(turn), proposer.id);
  const encryptedProposal = JSON.stringify(proposal); /// aes.encrypt(JSON.stringify(proposal), _gmW.publicKey).toString();
  const commitmentHash: string = utils.solidityKeccak256(['string'], [proposal]);

  const params: ProposalParams = {
    gameId,
    encryptedProposal,
    commitmentHash,
    proposer: proposer.wallet.address,
  };

  // const s = await signProposalMessage(message, verifierAddress, gm);

  return {
    params,
    proposal: JSON.stringify(proposal),
    proposerSignerId: proposer,
  };
};

export const mockProposals = async ({
  players,
  gameId,
  turn,
  verifierAddress,
  gm,
}: {
  players: SignerIdentity[];
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  gm: SignerIdentity;
}) => {
  let proposals = [] as any as ProposalSubmission[];
  for (let i = 0; i < players.length; i++) {
    let proposal = await mockProposalSecrets({
      gm,
      proposer: players[i],
      gameId,
      turn,
      verifierAddress,
    });
    proposals.push(proposal);
  }
  return proposals;
};

export default {
  setupAddresses,
  setupEnvironment,
  addPlayerNameId,
  baseFee,
};
