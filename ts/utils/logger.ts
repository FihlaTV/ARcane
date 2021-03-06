/*
 * Copyright (c) 2017 ARcane Developers
 *
 * This file is a part of ARcane. Please read the license text that
 * comes with the source code for use conditions.
 */

/* tslint:disable:no-console */

export class LogManager
{
    private topics: Map<string, LoggerImpl>;

    private omni: boolean;
    private enabledTopics: Map<string, boolean>;
    private disabledTopics: Map<string, boolean>;

    constructor()
    {
        this.topics = new Map<string, LoggerImpl>();
        this.omni = false;
        this.enabledTopics = new Map<string, boolean>();
        this.disabledTopics = new Map<string, boolean>();
    }

    enableTopic(topic: string): void
    {
        this.enabledTopics.set(topic, true);
        this.disabledTopics.delete(topic);

        const logger = this.topics.get(topic);
        if (logger) {
            logger.enabled = true;
        }
    }

    disableTopic(topic: string): void
    {
        this.disabledTopics.set(topic, true);

        const logger = this.topics.get(topic);
        if (logger) {
            logger.enabled = false;
        }
    }

    enableAllTopics(): void
    {
        this.omni = true;
        this.disabledTopics.clear();
        this.enabledTopics.clear();

        this.topics.forEach((logger) => {
            logger.enabled = true;
        });
    }

    disableAllTopics(): void
    {
        this.omni = false;
        this.disabledTopics.clear();
        this.enabledTopics.clear();

        this.topics.forEach((logger) => {
            logger.enabled = false;
        });
    }

    isTopicEnabled(topic: string): boolean
    {
        return !this.disabledTopics.has(topic) && (this.omni || this.enabledTopics.has(topic));
    }

    getLogger(topic: string): Logger
    {
        let logger = this.topics.get(topic);
        if (!logger) {
            logger = new LoggerImpl(topic);
            logger.enabled = this.isTopicEnabled(topic);
            this.topics.set(topic, logger);
        }
        return logger;
    }
}

export interface Logger
{
    isEnabled: boolean;
    log(msg: any): void;
    warn(msg: any): void;
    error(msg: any): void;
}

class LoggerImpl implements Logger
{
    enabled: boolean;

    constructor(private topic: string)
    {
    }

    get isEnabled(): boolean
    {
        return this.enabled;
    }

    log(msg: any): void
    {
        if (this.enabled) {
            console.log(`ARcane [${this.topic}]`, msg);
        }
    }

    warn(msg: any): void
    {
        console.warn(`ARcane [${this.topic}]`, msg);
    }

    error(msg: any): void
    {
        console.error(`ARcane [${this.topic}]`, msg);
    }
}
