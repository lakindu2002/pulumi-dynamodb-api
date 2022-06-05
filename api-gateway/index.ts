import * as awsx from '@pulumi/awsx'; // use Pulumi Crosswalk to easily define the API Gateway
import { Route } from '@pulumi/awsx/apigateway';
import * as users from './lambdas';

const API_ROUTES: Route[] = [
    { path: '/users/create', method: 'POST', eventHandler: users.createUser },
    { path: '/users/{id}', method: 'PATCH', eventHandler: users.updateUser },
    { path: '/users/{id}', method: 'DELETE', eventHandler: users.deleteUser },
    { path: '/users', method: 'GET', eventHandler: users.getAllUsers }
]

export const apiGateway = new awsx.apigateway.API('rest-api', {
    routes: API_ROUTES,
})