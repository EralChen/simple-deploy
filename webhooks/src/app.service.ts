import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  async getHello () {

    console.log('Hello World!')
    return 'Hello World!'
  }
}
