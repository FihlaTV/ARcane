/*
 * Copyright (c) 2017 ARcane Developers
 *
 * This file is a part of ARcane. Please read the license text that
 * comes with the source code for use conditions.
 */
import bind from 'bind-decorator';
import { IDisposable } from '../../utils/interfaces';

const root = document.body.parentElement as HTMLHtmlElement;

export class MouseRouter<T> implements IDisposable
{
    onMouseDown: ((e: MouseEvent, state: T | null) => T | null) | null;
    onMouseMove: ((e: MouseEvent, state: T) => void) | null;
    onMouseUp: ((e: MouseEvent, state: T, last: boolean) => void) | null;

    private buttons = new Map<number, boolean>();
    private state: T | null = null;

    constructor(private readonly e: HTMLElement)
    {
        this.e.addEventListener('mousedown', this.handleMouseDown);
    }

    dispose(): void
    {
        this.e.removeEventListener('mousedown', this.handleMouseDown);
    }

    @bind
    private handleMouseDown(e: MouseEvent): void
    {
        if (!this.onMouseDown) {
            return;
        }
        const state = this.onMouseDown(e, this.state);
        if (!state) {
            return;
        }
        this.state = state;

        if (this.buttons.size === 0) {
            root.addEventListener('mousemove', this.handleMouseMove);
            root.addEventListener('mouseup', this.handleMouseUp);
        }

        this.buttons.set(e.button, true);
    }

    @bind
    private handleMouseMove(e: MouseEvent): void
    {
        e.stopPropagation();

        if (this.onMouseMove && this.state) {
            this.onMouseMove(e, this.state);
        }
    }

    @bind
    private handleMouseUp(e: MouseEvent): void
    {
        e.stopPropagation();
        const last = this.buttons.size === 1;

        this.buttons.delete(e.button);

        if (last) {
            root.removeEventListener('mousemove', this.handleMouseMove);
            root.removeEventListener('mouseup', this.handleMouseUp);
        }

        if (this.onMouseUp && this.state) {
            this.onMouseUp(e, this.state, last);
        }

        this.state = null;
    }
}
