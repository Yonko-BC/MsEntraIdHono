import bcrypt from "bcrypt";
import { User } from "../types";

export const users: User[] = [
  {
    id: 1,
    username: "user1",
    email: "user1@example.com",
    password: bcrypt.hashSync("password1", 10),
    role: "chef-equipe",
    name: "John Doe",
  },
  {
    id: 2,
    username: "user2",
    email: "user2@example.com",
    password: bcrypt.hashSync("password2", 10),
    role: "manager",
    name: "Jane Smith",
  },
];
