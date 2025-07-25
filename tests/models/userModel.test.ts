import { jest, describe, expect, test, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mongoConfig, clearMongoDB, disconnectMongoDB } from '../../src/config/mongo';
import userModel from '../../src/models/user';
import { userFactory } from '../utils/userFactory';

describe('User Model', () => {
  beforeAll(async () => {
    await mongoConfig();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    await clearMongoDB();
  });

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('Schema Validation', () => {
    test('should create a valid user with all required fields', async () => {
      // Arrange
      const validUserData = userFactory.create();

      // Act
      const user = new userModel(validUserData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(validUserData.firstName);
      expect(savedUser.lastName).toBe(validUserData.lastName);
      expect(savedUser.email).toBe(validUserData.email);
      expect(savedUser.isVerified).toBe(validUserData.isVerified); // default value
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should fail validation when firstName is missing', async () => {
      // Arrange
      const invalidUserData = userFactory.createWithMissingFields('firstName');

      // Act & Assert
      const user = new userModel(invalidUserData);
      await expect(user.save()).rejects.toThrow('A user must have a first name');
    });

    test('should fail validation when lastName is missing', async () => {
      // Arrange
      const invalidUserData = userFactory.createWithMissingFields('lastName');

      // Act & Assert
      const user = new userModel(invalidUserData);
      await expect(user.save()).rejects.toThrow('A user must have a last name');
    });

    test('should fail validation when username is missing', async () => {
      // Arrange
      const invalidUserData = userFactory.createWithMissingFields('username');

      // Act & Assert
      const user = new userModel(invalidUserData);
      await expect(user.save()).rejects.toThrow('A user must have a username');
    });

    test('should fail validation when email is missing', async () => {
      // Arrange
      const invalidUserData = userFactory.createWithMissingFields('email');

      // Act & Assert
      const user = new userModel(invalidUserData);
      await expect(user.save()).rejects.toThrow('A user must have an email');
    });

    test('should fail validation with invalid email format', async () => {
      // Arrange
      const invalidUserData = userFactory.create({ email: 'ahmed123' });

      // Act & Assert
      const user = new userModel(invalidUserData);
      await expect(user.save()).rejects.toThrow('This email is invalid');
    });

    test('should fail validation when password is too short', async () => {
      // Arrange
      const invalidUserData = userFactory.create({ password: 'short' });

      // Act & Assert
      const user = new userModel(invalidUserData);
      await expect(user.save()).rejects.toThrow('Password must have 8 characters at least');
    });

    test('should trim whitespace from string fields', async () => {
      // Arrange
      const userDataWithWhitespace = userFactory.create({
        firstName: '  Ahmed  ',
        lastName: '  Mohamed  ',
        email: '  ahmed.mohamed@example.com   ',
      });

      // Act
      const user = new userModel(userDataWithWhitespace);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.firstName).toBe('Ahmed');
      expect(savedUser.lastName).toBe('Mohamed');
      expect(savedUser.email).toBe('ahmed.mohamed@example.com');
      // Note: password will be hashed, so we can't directly check trimming
    });

    test('should enforce unique username constraint', async () => {
      // Arrange
      const userData1 = userFactory.create({ email: 'user1@example.com', username: 'user1' });

      const userData2 = userFactory.create({ email: 'user2@example.com', username: 'user1' });

      // Act
      const user1 = new userModel(userData1);
      await user1.save();

      const user2 = new userModel(userData2);

      // Assert
      await expect(user2.save()).rejects.toThrow('This username already exists');
    });

    test('should enforce unique email constraint', async () => {
      // Arrange
      const userData1 = userFactory.create({ email: 'user1@example.com', username: 'user1' });

      const userData2 = userFactory.create({ email: 'user1@example.com', username: 'user2' });

      // Act
      const user1 = new userModel(userData1);
      await user1.save();

      const user2 = new userModel(userData2);

      // Assert
      await expect(user2.save()).rejects.toThrow('This email already exists');
    });
  });

  describe('Virtual Properties', () => {
    test('should return correct fullName virtual property', async () => {
      // Arrange
      const userData = userFactory.create();

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.fullName).toBe([userData.firstName, userData.lastName].join(' '));
    });

    test('should include virtuals in JSON output', async () => {
      // Arrange
      const userData = userFactory.create();

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();
      const userJSON = savedUser.toJSON();

      // Assert
      expect(userJSON.fullName).toBe([userData.firstName, userData.lastName].join(' '));
    });

    test('should include virtuals in Object output', async () => {
      // Arrange
      const userData = userFactory.create();

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();
      const userObject = savedUser.toObject();

      // Assert
      expect(userObject.fullName).toBe([userData.firstName, userData.lastName].join(' '));
    });
  });

  describe('Password Hashing Middleware', () => {
    test('should hash password before saving', async () => {
      // Arrange
      const userData = userFactory.create();

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should not hash password if not modified', async () => {
      // Arrange
      const userData = userFactory.create();

      const user = new userModel(userData);
      const savedUser = await user.save();
      const originalHashedPassword = savedUser.password;

      // Act - Update firstName (not password)
      savedUser.firstName = 'Selim';
      const updatedUser = await savedUser.save();

      // Assert
      expect(updatedUser.password).toBe(originalHashedPassword);
    });

    test('should hash password again when password is modified', async () => {
      // Arrange
      const userData = userFactory.create();

      const user = new userModel(userData);
      const savedUser = await user.save();
      const originalHashedPassword = savedUser.password;

      // Act - Update password
      savedUser.password = 'newPassword123';
      const updatedUser = await savedUser.save();

      // Assert
      expect(updatedUser.password).not.toBe(originalHashedPassword);
      expect(updatedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('Instance Methods', () => {
    describe('checkPassword method', () => {
      test('should return true for correct password', async () => {
        // Arrange
        const userData = userFactory.create();

        const user = new userModel(userData);
        const savedUser = await user.save();

        // Act
        const isPasswordCorrect = await savedUser.checkPassword(userData.password as string);

        // Assert
        expect(isPasswordCorrect).toBe(true);
      });

      test('should return false for incorrect password', async () => {
        // Arrange
        const userData = userFactory.create();

        const user = new userModel(userData);
        const savedUser = await user.save();

        // Act
        const isPasswordCorrect = await savedUser.checkPassword('wrongpassword');

        // Assert
        expect(isPasswordCorrect).toBe(false);
      });
    });
  });

  describe('Default Values', () => {
    test('should set isVerified to false by default', async () => {
      // Arrange
      const userData = userFactory.create();

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.isVerified).toBe(false);
    });

    test('should allow isVerified to be set explicitly', async () => {
      // Arrange
      const userData = userFactory.createWithMissingFields('isVerified');

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.isVerified).toBe(false);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      // Arrange
      const userData = userFactory.create();

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when document is modified', async () => {
      // Arrange
      const userData = userFactory.create();

      const user = new userModel(userData);
      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      savedUser.firstName = 'Selim';
      const updatedUser = await savedUser.save();

      // Assert
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Optional Fields', () => {
    test('should allow passwordUpdatedAt to be undefined', async () => {
      // Arrange
      const userData = userFactory.create();

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.passwordUpdatedAt).toBeUndefined();
    });

    test('should allow passwordUpdatedAt to be  ', async () => {
      // Arrange
      const passwordUpdatedAt = new Date();
      const userData = userFactory.create({ passwordUpdatedAt });

      // Act
      const user = new userModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.passwordUpdatedAt).toEqual(passwordUpdatedAt);
    });
  });
});
