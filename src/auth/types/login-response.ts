import { User } from "src/users/entities/user.entity";

export interface LoginResponse {
    user: Partial<User>;
    token: string;
}