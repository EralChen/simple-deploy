import { Body, Controller, Headers, HttpException, Post, UseInterceptors } from '@nestjs/common'
import { run } from '@lib-env/shared'
import { codesRoot, workRoot } from '@lib-env/path'
import * as fs from 'node:fs'
import { consola } from 'consola'
import * as path from 'node:path'
import { DeployLock } from './deploy.decorator'
import { LockInterceptor } from './deploy.interceptor'


interface GitlabPushEvent {
  project: {
    path_with_namespace: string
  }
  repository: {
    git_http_url: string
  }
}

interface DeployConfig {
  path: {
    dist: string
    html: string
  }
  scripts: string[]
}

@Controller('deploy')
@UseInterceptors(LockInterceptor)
export class DeployController {
  @Post('zz-platform-config')
  @DeployLock()
  async deployZzPlatformConfig (
    @Body() body: GitlabPushEvent,
    @Headers('X-Gitlab-Token') token: string,
  ) {

    consola.info('开始部署', body.project.path_with_namespace)
    await new Promise(resolve => setTimeout(resolve, 1000))
    consola.info('部署完成', body.project.path_with_namespace)
    return 'Deployed!'

    // 校验 Secret token 是否正确
    if (token !== '123456') return new HttpException({
      code: 401,
      message: 'Unauthorized',
    }, 401)

    // 检查仓库是否已经拉取过
    const codeDir = path.resolve(codesRoot, body.project.path_with_namespace)


    if (
      // 文件夹存在
      fs.existsSync(codeDir)
      // 并且文件夹为空
      && !fs.readdirSync(codeDir).length
    ) {
      // 清除该文件夹
      fs.rmdirSync(codeDir)
    }

    if (
      // 文件夹不存在
      !fs.existsSync(codeDir)
    ) {
      /**
       * git clone 
       * @example
       * git clone http://192.168.110.138:30080/rd/platform/zz-platform-config.git rd/platform/zz-platform-config
       */
      await run(`git clone ${body.repository.git_http_url} ${body.project.path_with_namespace}`, codesRoot)
    } else {
      // 文件夹存在, 且不为空
      // 放弃当前修改
      await run('git reset --hard', codeDir)
      // 拉取最新代码
      await run('git pull', codeDir)
    }

    // 下载/更新 pnpm 
    await run('npm i -g pnpm', codeDir)


    // 安装依赖
    await run('pnpm i', codeDir)


    const deployInfos = (function () {
      let deployList = [{}] as DeployConfig[]
      if (fs.existsSync(
        path.resolve(codeDir, 'deploy.config.json'),
      )) {
        const jsonObj = JSON.parse(
          fs.readFileSync(
            path.resolve(codeDir, 'deploy.config.json'),
            'utf-8',
          ),
        )
        if (Array.isArray(jsonObj)) {
          deployList = jsonObj
        } else {
          deployList = [jsonObj]
        }
      }
      return deployList.map(deployConfig => {
        const scripts = deployConfig.scripts || []
        const pathDist = deployConfig.path?.dist ?? './dist'
        const pathHtml = deployConfig.path?.html ?? path.resolve(workRoot, 'nginx/html', body.project.path_with_namespace)

        return {
          scripts,

          path: {
            // 从 dist 中取出所有文件
            dist: pathDist,

            // 将取出的文件放入 nginx 的指定目录下
            html: pathHtml,
          },
        }
      })
    })()


    for (const deployInfo of deployInfos) {

      // 如果 dist 文件夹存在，清空文件夹
      if (fs.existsSync(deployInfo.path.dist)) {
        await fs.promises.rm(deployInfo.path.dist, { recursive: true })
      }


      // 执行构建命令
      for (const script of deployInfo.scripts) {
        await run(`npm run ${script}`, codeDir)
      }

      // 如果 html 文件夹存在，重名文件夹【自动备份】
      if (fs.existsSync(deployInfo.path.html)) {
        await fs.promises.rename(
          deployInfo.path.html,
          // 年月日
          deployInfo.path.html + '.' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        )
      }


      // 将 dist 下所有文件放入 html 下
      consola.log('开始拷贝文件')
      await fs.promises.cp(
        deployInfo.path.dist,
        deployInfo.path.html,
        {
          recursive: true,
        },
      )
      consola.success('部署成功')
    }


    return 'Deployed!'
  }

}
