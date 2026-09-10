export const requireSupabaseAuth = async ({ next }: { next: () => Promise<unknown> }) => {
  return next();
};

export const authMiddleware = requireSupabaseAuth;
