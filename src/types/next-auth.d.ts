import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      organization?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    organization?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organization?: string | null;
  }
}
