import * as bcrypt from 'bcrypt'
import { Role, User } from 'src/users/entities/user.entity'
import { faker } from '@faker-js/faker'

const password = bcrypt.hashSync('password', 2)

export function usersSeeder(){
    const adminUser = createAdminUser();
    const authors = createAuthors();
    const users: User[] = [adminUser, ...authors]; 
    return users;
}

export function createAdminUser(){
    const name = 'Administrador'
    const email = 'admin@uss.com'
    const role = Role.ADMIN
    const user: User = { 
        name, 
        email, 
        password, 
        role,
        image: faker.image.avatarGitHub(),
        isActive: true,
        createdAt: new Date() 
    }
    return user;
}

function createAuthors(){
    const authors: User[] = [];
    for (let i = 0; i < 15; i++) {
        const name = faker.person.fullName();
        const email = faker.internet.email();
        const image = faker.image.avatarGitHub();
        const role = Role.AUTHOR;
        const isActive = faker.number.int({min: 0, max: 5}) !== 1;
        const createdAt = faker.date.recent({days: 30});
        authors.push({ name, email, password, image, role, isActive, createdAt});
    }
    return authors;
}
