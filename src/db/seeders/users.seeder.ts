import * as bcrypt from 'bcrypt'
import { AppDataSource } from '.'
import { User } from 'src/users/entities/user.entity'

const password = bcrypt.hashSync('password', 2)

export async function usersSeeder(){
    const adminUser = createAdminUser()
    return AppDataSource.manager.save(User, adminUser)
}

export function createAdminUser(){
    const name = 'Administrador'
    const email = 'admin@uss.com'
    return { name, email, password }
}
