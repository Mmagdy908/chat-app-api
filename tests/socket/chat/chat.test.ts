import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { Socket } from 'socket.io';
import * as chatController from '../../../src/controllers/socket/chatSocketController';
import * as chatService from '../../../src/services/chatService';
import { Chat } from '../../../src/interfaces/models/chat';
import { GetChatResponse } from '../../../src/schemas/chatSchemas';

// Mock dependencies
jest.mock('../../../src/services/chatService');

describe('Unit Tests - joinUserChats', () => {
  let socket: any;
  let io: any;

  beforeEach(() => {
    socket = {
      join: jest.fn(),
      request: { user: { id: 'user123' } },
    };
    io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('should join user to their chat rooms', async () => {
    // Arrange
    const mockChats = [{ id: 'chat1' }, { id: 'chat2' }] as GetChatResponse[];
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);

    // Act
    await chatController.joinUserChats(io, socket as Socket)('user123');

    // Assert
    expect(chatService.getAllChatsByMember).toHaveBeenCalledWith('user123');
    expect(socket.join).toHaveBeenCalledWith(['chat:chat1', 'chat:chat2']);
  });

  test('should handle errors gracefully', async () => {
    // Arrange
    const error = new Error('Database error');
    jest.mocked(chatService.getAllChatsByMember).mockRejectedValue(error);

    // Act
    await chatController.joinUserChats(io, socket as Socket)('user123');

    // Assert
    expect(chatService.getAllChatsByMember).toHaveBeenCalledWith('user123');
    expect(socket.join).not.toHaveBeenCalled();
  });
});
