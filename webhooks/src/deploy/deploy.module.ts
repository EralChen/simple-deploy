import { Module } from '@nestjs/common'
import { DeployController } from './deploy.controller'
import { LockInterceptor } from './deploy.interceptor'

@Module({
  controllers: [DeployController],
  providers: [LockInterceptor],
})
export class DeployModule {}
