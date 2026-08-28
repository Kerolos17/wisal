export type StoredReceipt = { key: string; mime: string; size: number; checksum: string };

type ReceiptSubmissionOptions<T> = {
  previousReceiptKey: string | null;
  store: () => Promise<StoredReceipt>;
  submit: (receipt: StoredReceipt) => Promise<T>;
  discard: (key: string) => Promise<void>;
};

/**
 * Keeps receipt storage aligned with the authoritative payment state.
 * A failed state transition must not leave its newly uploaded proof behind.
 */
export async function submitStoredReceipt<T>({ previousReceiptKey, store, submit, discard }: ReceiptSubmissionOptions<T>) {
  const receipt = await store();
  try {
    const result = await submit(receipt);
    if (previousReceiptKey && previousReceiptKey !== receipt.key) {
      await discard(previousReceiptKey).catch(() => {});
    }
    return result;
  } catch (error) {
    await discard(receipt.key).catch(() => {});
    throw error;
  }
}
