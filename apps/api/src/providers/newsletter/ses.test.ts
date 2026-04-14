import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SesNewsletterStore } from './ses.ts';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-sesv2', () => {
  class AlreadyExistsException extends Error {
    override name = 'AlreadyExistsException';
  }
  return {
    SESv2Client: class {
      send = mockSend;
    },
    CreateContactCommand: class {
      constructor(params: unknown) {
        Object.assign(this, { _type: 'create', ...(params as object) });
      }
    },
    UpdateContactCommand: class {
      constructor(params: unknown) {
        Object.assign(this, { _type: 'update', ...(params as object) });
      }
    },
    DeleteContactCommand: class {
      constructor(params: unknown) {
        Object.assign(this, { _type: 'delete', ...(params as object) });
      }
    },
    AlreadyExistsException,
  };
});

describe('SesNewsletterStore', () => {
  const store = new SesNewsletterStore('test-list');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribe', () => {
    it('creates a new contact', async () => {
      mockSend.mockResolvedValue({});
      await store.subscribe('user@example.com');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'create',
          ContactListName: 'test-list',
          EmailAddress: 'user@example.com',
          UnsubscribeAll: false,
        })
      );
    });

    it('updates contact when already exists', async () => {
      const { AlreadyExistsException } = await import('@aws-sdk/client-sesv2');
      mockSend
        .mockRejectedValueOnce(new AlreadyExistsException({ message: 'exists', $metadata: {} }))
        .mockResolvedValueOnce({});

      await store.subscribe('user@example.com');

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenLastCalledWith(
        expect.objectContaining({
          _type: 'update',
          EmailAddress: 'user@example.com',
          UnsubscribeAll: false,
        })
      );
    });

    it('re-throws non-AlreadyExists errors', async () => {
      mockSend.mockRejectedValue(new Error('Permission denied'));
      await expect(store.subscribe('user@example.com')).rejects.toThrow('Permission denied');
    });
  });

  describe('unsubscribe', () => {
    it('updates contact with UnsubscribeAll: true', async () => {
      mockSend.mockResolvedValue({});
      await store.unsubscribe('user@example.com');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'update',
          EmailAddress: 'user@example.com',
          UnsubscribeAll: true,
        })
      );
    });
  });

  describe('delete', () => {
    it('deletes the contact', async () => {
      mockSend.mockResolvedValue({});
      await store.delete('user@example.com');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'delete',
          EmailAddress: 'user@example.com',
        })
      );
    });
  });
});
