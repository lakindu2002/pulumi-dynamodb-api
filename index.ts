// stack resources are declared in this file
import { Users } from './dynamo/users';
import { apiGateway } from './api-gateway/index';

export const UsersTable = Users.name;
export const { url } = apiGateway;