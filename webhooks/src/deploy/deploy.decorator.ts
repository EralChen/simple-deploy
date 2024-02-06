import { SetMetadata } from '@nestjs/common'

export const DEPLOY_LOCK_KEY = 'deploy-lock'

export const DeployLock = () => SetMetadata(DEPLOY_LOCK_KEY, true)
