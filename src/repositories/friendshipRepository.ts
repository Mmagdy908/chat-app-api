import { PopulateOptions } from 'mongoose';
import { Friendship } from '../interfaces/models/friendship';
import friendshipModel from '../models/friendship';
import { Friendship_Status } from '../enums/friendshipEnums';

export const create = async (friendshipData: Partial<Friendship>): Promise<Friendship> => {
  return await friendshipModel.create(friendshipData);
};

export const getById = async (
  id: string,
  ...populateOptions: PopulateOptions[]
): Promise<Friendship | null> => {
  const query = friendshipModel.findById(id);
  populateOptions?.forEach((option) => query.populate(option));
  return await query;
};

export const getBySenderRecipientId = async (
  senderId: string,
  recipientId: string,
  ...populateOptions: PopulateOptions[]
): Promise<Friendship | null> => {
  const query = friendshipModel.findOne({ userPair: { $all: [senderId, recipientId] } });
  populateOptions?.forEach((option) => query.populate(option));
  return await query;
};

export const getAllByUser = async (userId: string): Promise<Friendship[]> => {
  return await friendshipModel.find({
    userPair: { $elemMatch: { $eq: userId } },
    status: Friendship_Status.Accepted,
  });
};

export const updateById = async (
  id: string,
  newfriendshipData: Partial<Friendship>
): Promise<Friendship | null> => {
  return await friendshipModel.findByIdAndUpdate(id, newfriendshipData, { new: true });
};
