import * as bcrypt from 'bcrypt'
import { AppDataSource } from '.'
import { Role, User } from 'src/users/entities/user.entity'
import { faker } from '@faker-js/faker'

const password = bcrypt.hashSync('password', 2)

export async function usersSeeder(){
    const adminUser = createAdminUser();
    const authors = createAuthors();
    return AppDataSource.manager.save(User, [adminUser, ...authors])
}

export function createAdminUser(){
    const name = 'Administrador'
    const email = 'admin@uss.com'
    const role = Role.ADMIN
    return { name, email, password, role }
}

function createAuthors(){
    const authors = [];
    for (let i = 0; i < 30; i++) {
        const name = faker.person.fullName();
        const email = faker.internet.email();
        const image = faker.image.avatarGitHub();
        const role = Role.AUTHOR;
        authors.push({ name, email, password, image, role });
    }
    return authors;
}
