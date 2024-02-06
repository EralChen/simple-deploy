import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { DEPLOY_LOCK_KEY } from './deploy.decorator'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class LockInterceptor implements NestInterceptor {
  private locksQueues: Map<string, Promise<any>[]> = new Map()

  async intercept (
    context: ExecutionContext, 
    next: CallHandler,
  ) {


    const needLocked = Reflect.getMetadata(
      DEPLOY_LOCK_KEY, 
      context.getHandler(),
    )

    if (needLocked) {

      const lockKey = context.getHandler().name

      
      // 如果有队列就等待之前的任务完成，然后再执行当前任务
      let queue = this.locksQueues.get(lockKey)

      queue ?? (
        this.locksQueues.set(lockKey, []),
        queue = this.locksQueues.get(lockKey)
      )
      


      const taskPromise = Promise.allSettled([...queue])
        .then(() => {
          const curentTask = lastValueFrom(next.handle())

          queue.push(curentTask)

          return curentTask

        }).then((res) => {
          // 任务完成后，从队列中移除当前任务
          const currentTaskIndex = queue.indexOf(taskPromise)
          queue.splice(currentTaskIndex, 1)
          return res
        })

      return taskPromise
    } else {
      return next.handle()
    }
  }

  
}