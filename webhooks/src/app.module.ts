import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DeployModule } from './deploy/deploy.module'



@Module({
  imports: [
    DeployModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
