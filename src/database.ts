import sequelize from './sequelize';
import { UserProfile } from './models/UserProfile';
import { Agent } from './models/Agent';
import { WalletTransaction } from './models/WalletTransaction';
import { PlayerAgentRequest } from '../src/types/game';
import { PlayerAgentRequestModel } from './models/PlayerAgentRequestModel';
import { GameRoom as GameRoomModel } from './models/GameRoom';
import { LudoPlayer as LudoPlayerModel } from './models/LudoPlayer';
import { GameRoom } from '../src/types/game';
import { LudoPlayer } from '../src/types/game';
import { GameState as GameStateModel } from './models/GameState';
import { LudoToken as LudoTokenModel } from './models/LudoToken';


// User Functions
export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  const user = await UserProfile.findByPk(userId);
  return user ? user.get({ plain: true }) : null;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const users = await UserProfile.findAll({ order: [['createdAt', 'DESC']] });
  return users.map(u => u.get({ plain: true }));
};

export const getUserByFirebaseUid = async (firebaseUid: string): Promise<UserProfile | null> => {
  const user = await UserProfile.findOne({ where: { firebaseUid } });
  return user ? user.get({ plain: true }) : null;
};

export const createUser = async (userData: Partial<UserProfile>): Promise<UserProfile> => {
  const user = await UserProfile.create(userData);
  return user.get({ plain: true });
};

export const updateUser = async (userId: string, updates: Partial<UserProfile>): Promise<[number, UserProfile[]]> => {
  return UserProfile.update(updates, { where: { id: userId }, returning: true });
};

// Agent Functions
export const getAgentByPromoCode = async (promoCode: string): Promise<Agent | null> => {
  const agent = await Agent.findOne({ where: { promoCode } });
  return agent ? agent.get({ plain: true }) : null;
};

export const linkAgentToPlayer = async (userId: string, agentId: string): Promise<void> => {
  await UserProfile.update({ linkedAgentId: agentId }, { where: { id: userId } });
};

export const getAgentById = async (agentId: string): Promise<Agent | null> => {
    const agent = await Agent.findByPk(agentId);
    return agent ? agent.get({ plain: true }) : null;
};

// Transaction Functions
export const createTransaction = async (txData: Partial<WalletTransaction>): Promise<WalletTransaction> => {
  const transaction = await WalletTransaction.create(txData);
  return transaction.get({ plain: true });
};

export const getTransactionsByUserId = async (userId: string): Promise<WalletTransaction[]> => {
  const transactions = await WalletTransaction.findAll({ where: { userId }, order: [['timestamp', 'DESC']] });
  return transactions.map(t => t.get({ plain: true }));
};

export const getAllTransactions = async (): Promise<WalletTransaction[]> => {
  const transactions = await WalletTransaction.findAll({ order: [['timestamp', 'DESC']] });
  return transactions.map(t => t.get({ plain: true }));
};

export const depositToPlayerWallet = async (userId: string, amount: number, description: string): Promise<UserProfile> => {
  const t = await sequelize.transaction();
  try {
    const user = await UserProfile.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      throw new Error('User not found');
    }

    const newBalance = user.balance + amount;
    
    await WalletTransaction.create({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type: 'deposit',
      amount,
      timestamp: Date.now(),
      description,
    }, { transaction: t });

    await user.update({ balance: newBalance }, { transaction: t });

    await t.commit();
    const reloadedUser = await user.reload();
    return reloadedUser.get({ plain: true });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const withdrawFromPlayerWallet = async (userId: string, amount: number, description: string): Promise<UserProfile> => {
  const t = await sequelize.transaction();
  try {
    const user = await UserProfile.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      throw new Error('User not found');
    }

    if (user.balance < amount) {
        await t.rollback();
        throw new Error('Insufficient funds');
    }

    const newBalance = user.balance - amount;
    
    await WalletTransaction.create({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type: 'withdrawal',
      amount,
      timestamp: Date.now(),
      description,
    }, { transaction: t });

    await user.update({ balance: newBalance }, { transaction: t });

    await t.commit();
    const reloadedUser = await user.reload();
    return reloadedUser.get({ plain: true });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};


export const createPlayerAgentRequest = async (requestData: PlayerAgentRequest): Promise<PlayerAgentRequestModel> => {
    const newRequest = await PlayerAgentRequestModel.create(requestData);
    return newRequest;
};

export const getAgents = async (): Promise<Agent[]> => {
    const agents = await Agent.findAll();
    return agents.map(a => a.get({ plain: true }));
};


export const getRoomById = async (roomId: string): Promise<GameRoom | null> => {
    const room = await GameRoomModel.findByPk(roomId, {
        include: [
            { model: LudoPlayerModel, as: 'players' },
            { model: GameStateModel, as: 'gameState', include: [{ model: LudoTokenModel, as: 'tokens' }] }
        ]
    });
    return room ? room.get({ plain: true }) as GameRoom : null;
};


export const getActiveRooms = async (): Promise<GameRoom[]> => {
    const rooms = await GameRoomModel.findAll({
        where: { status: 'playing' },
        include: [{ model: LudoPlayerModel, as: 'players' }]
    });
    return rooms.map(r => r.get({ plain: true }) as GameRoom);
};


export const addUserToMatchmakingQueue = async (queueData: any): Promise<void> => {
    // Implementation depends on MatchmakingModel
    // For now, this is a placeholder
    console.log('addUserToMatchmakingQueue:', queueData);
};

export const removeUsersFromMatchmakingQueue = async (userIds: string[]): Promise<void> => {
    // Implementation depends on MatchmakingModel
    console.log('removeUsersFromMatchmakingQueue:', userIds);
};

export const getAdminUserByUsername = async (username: string): Promise<any | null> => {
    // Implementation depends on AdminUser model
    console.log('getAdminUserByUsername:', username);
    return null;
};

export const createAdminUser = async (adminData: any): Promise<any> => {
    // Implementation depends on AdminUser model
    console.log('createAdminUser:', adminData);
    return {};
};

export const getAllAdminUsers = async (): Promise<any[]> => {
    console.log('getAllAdminUsers');
    return [];
};

export const getAdminUserById = async (adminId: string): Promise<any | null> => {
    console.log('getAdminUserById:', adminId);
    return null;
};

export const updateAdminUser = async (adminId: string, updates: any): Promise<any> => {
    console.log('updateAdminUser:', adminId, updates);
    return {};
};

export const deleteAdminUser = async (adminId: string): Promise<void> => {
    console.log('deleteAdminUser:', adminId);
};

export const getAgentByUsername = async (username: string): Promise<any | null> => {
    console.log('getAgentByUsername:', username);
    return null;
}

export const createAgent = async (agentData: any): Promise<any> => {
    console.log('createAgent:', agentData);
    return {};
}

export const updateAgent = async (agentId: string, updates: any): Promise<any> => {
    console.log('updateAgent:', agentId, updates);
    return {};
}

export const creditAgentFloat = async (agentId: string, amount: number): Promise<any> => {
    console.log('creditAgentFloat:', agentId, amount);
    return {};
}

export const getAgentRequests = async (): Promise<any[]> => {
    console.log('getAgentRequests');
    return [];
}

export const approveAgentRequest = async (requestId: string): Promise<any> => {
    console.log('approveAgentRequest:', requestId);
    return {};
}

export const rejectAgentRequest = async (requestId: string): Promise<any> => {
    console.log('rejectAgentRequest:', requestId);
    return {};
}

export const getAgentTransactions = async (agentId: string): Promise<any[]> => {
    console.log('getAgentTransactions:', agentId);
    return [];
}

export const depositToPlayer = async (agentId: string, playerId: string, amount: number): Promise<any> => {
    console.log('depositToPlayer:', agentId, playerId, amount);
    return {};
}

export const createRoom = async (roomData: any): Promise<any> => {
    console.log('createRoom:', roomData);
    return {};
}

export const addPlayerToRoom = async (roomId: string, playerData: any): Promise<any> => {
    console.log('addPlayerToRoom:', roomId, playerData);
    return {};
}

export const removePlayerFromRoom = async (roomId: string, playerId: string): Promise<any> => {
    console.log('removePlayerFromRoom:', roomId, playerId);
    return {};
}

export const startGame = async (roomId: string): Promise<any> => {
    console.log('startGame:', roomId);
    return {};
}
