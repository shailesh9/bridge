"use strict";

import RabbitMQ from "ch-rabbitmq-controller";
import eventReg from "ch-event-registry";

export class QueueService {

  constructor({rabbitConfig, legacyProcessor, realtimeProcessor, logger}) {

    /** @member {string} config for rabbit mq. */
    this.rabbitConfig_ = rabbitConfig;

    /** @member {Object} rabbit mq object for accessing the queue. */
    QueueService.rabbitMQ_ = new RabbitMQ(rabbitConfig, logger);

    /** @member {Object} logger instance for logging. */
    this.loggerInstance_ = logger;

    /** @member {Object} Legacy Processor  */
    QueueService.LegacyProcessor = legacyProcessor;

    /** @member {Object} Real Time Processor */
    QueueService.RealtimeProcessor = realtimeProcessor;

    QueueService.rabbitMQ_.on("msgReceived", this.processQueueEvents);
  }

  /**
   * Process messages received from queue
   * @private
   * @param {string} message Invoke relevant Processor according to message
   * @returns {void} Returns Promise
   */
  processQueueEvents(message) {

    let queueReceivedMessage = message.content.toString(),
      legacyEvent = JSON.parse(queueReceivedMessage).msg,
      realTimeEvent = JSON.parse(queueReceivedMessage).resourceEvent;

    console.log("app.processQueueEvents()===> rabbitmq message ==>>>>>>", queueReceivedMessage);
    console.log("app.processQueueEvents(): RealTime Event: %s , Legacy Event: %s ==>", realTimeEvent, legacyEvent);

    // Legacy Migration Code
    if (eventReg.events.focus.legacyMigration === legacyEvent) {
      console.log("=========Inside migration completed event===============");

      // Legacy Processing Code Started
      QueueService.LegacyProcessor.start(queueReceivedMessage)
        .then(() => {

          this.acknowledgeMessage(message)
            .then(() => {
              console.log(`$$$ Success Legacy: ${QueueService.name}.acknowledgeMessage() $$$`, queueReceivedMessage);
            });
        })
        .catch(err => {
          console.log("Error in Legacy acknowledgeMessage", err);
        })
        .done();

    } else {

      console.log("=========Inside real time event===============");

      let eventResgistryInstance = eventReg.eventResgistryInstance,
        eventResourceMap = eventReg.eventResourceMap,
        eventContainer = eventResgistryInstance.lookupForEventContainer(realTimeEvent),
        focusMatrix = eventResourceMap.get(eventContainer).FocusMatrix;

      console.log("inside real time processor ==> ", focusMatrix);
      // Real Time Processing Code Started
      QueueService.RealtimeProcessor.start(focusMatrix, queueReceivedMessage)
        .then(() => {

          this.acknowledgeMessage(message)
            .then(() => {
              console.log(`$$$ Success RealTime: ${QueueService.name}.acknowledgeMessage() $$$`, queueReceivedMessage);
            });
        })
        .catch(err => {
          console.log("Error in RealTime acknowledgeMessage", err);
        })
        .done();
    }
  }

  /**
   * Consume messages from the queue.
   * @public
   * @returns {Q.Promise} Returns Promise
   */
  consume() {
    return QueueService.rabbitMQ_.consume(this.rabbitConfig_.queueName);
  }

  /**
   * Acknowledge messages received from the queue.
   * @private
   * @param {string} message Message to be acknowledged
   * @returns {Q.Promise} Returns Q.Promise
   */
  acknowledgeMessage(message) {
    return QueueService.rabbitMQ_.acknowledgeMessage(message);
  }

}
