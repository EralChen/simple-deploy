import { Body, Controller, Headers, HttpException, Post, UseInterceptors } from '@nestjs/common'
import { DeployLock } from './deploy.decorator'
import { LockInterceptor } from './deploy.interceptor'
import { DeployService } from './deploy.service'
import { GitlabPushEvent } from './depoloy.types'
import consola from 'consola'


@Controller('deploy')
@UseInterceptors(LockInterceptor)
export class DeployController {
  constructor (private readonly deployService: DeployService) {}

  @Post('zz-platform-config')
  @DeployLock()
  async deployZzPlatformConfig (
    @Body() body: GitlabPushEvent,
    @Headers('X-Gitlab-Token') token: string,
  ) {

    // 校验 Secret token 是否正确
    if (token !== '123456') return new HttpException({
      code: 401,
      message: 'Unauthorized',
    }, 401)


    consola.info('deployZzPlatformConfig', 'cuCode')
    const { dir: codeDir } = await this.deployService.cuCode(body)

    
    consola.info('deployZzPlatformConfig', 'uDependencies')
    await this.deployService.uDependencies(codeDir)


    const deployConfigs = await this.deployService.rDeployConfigs(codeDir, body)


    for (const deployConfig of deployConfigs) {
      await this.deployService.deploy(codeDir, deployConfig)
    }

    return {
      code: 200,
      message: 'ok',
    }
  }

}
