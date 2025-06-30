import { EventType } from '@/common/constants/events';
import '@nestjs/event-emitter';
import { OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';

declare module '@nestjs/event-emitter' {
  export declare type OnEventType = EventType;

  export declare const OnEvent: (
    event: OnEventType,
    options?: OnEventOptions,
  ) => MethodDecorator;

  interface EventEmitter2 {
    emit(event: EventType, ...values: any[]): boolean;
  }
}
