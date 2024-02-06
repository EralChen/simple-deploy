import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { DEPLOY_LOCK_KEY } from './deploy.decorator';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable()
export class LockInterceptor implements NestInterceptor {
  private locks: Map<string, boolean> = new Map();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    console.log('context:', context)
    
    const needLocked = Reflect.getMetadata(
      DEPLOY_LOCK_KEY, 
      context.getHandler()
    );

    if (needLocked) {

      const lockKey = context.getHandler().name;

      if (this.locks.has(lockKey) && this.locks.get(lockKey)) {
        throw new Error('Already locked. Try again later.');
      }

      this.locks.set(lockKey, true);


      const result = await lastValueFrom(next.handle());

      this.locks.set(lockKey, false);

      return result;
    
    } else {
      return next.handle();
    }
  }

  
}