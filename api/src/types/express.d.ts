declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      logError?: (error: unknown) => void;
    }
  }
}

export {};
