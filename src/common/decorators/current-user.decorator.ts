import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestWithUser {
  user: CurrentUserPayload;
}
export interface CurrentUserPayload {
  userId: string;
  accountId: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
