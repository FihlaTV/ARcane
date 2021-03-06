/*
 * Copyright (c) 2017 ARcane Developers
 *
 * This file is a part of ARcane. Please read the license text that
 * comes with the source code for use conditions.
 */
import * as React from 'react';
import bind from 'bind-decorator';

import { Stopwatch } from '../utils/time';

import { Port } from './utils/port';
import { RequestAnimationFrame } from './utils/animationframe';

import { EditorState, DisplayMode } from './editorstate';
import { ViewportPersistent, ViewportPersistentListener } from './viewportpersistent';

import { ARMain, ARState } from '../xr/main';

const classNames = require('./viewport.less');

export interface ViewportProps
{
    persistent: ViewportPersistent;
    editorState: EditorState;

    onChangeEditorState: (reducer: (old: EditorState) => EditorState) => void;
}

export interface State
{
    loaded: boolean;
    switchingMode: boolean;

    arState: ARState;
    arPlaying: boolean;

    actualDisplayMode: DisplayMode;

    /** Can be manipulated only via the React developer tools and `window.enableProfiling()`. */
    profilingEnabled: boolean;
}

export class Viewport extends React.Component<ViewportProps, State> implements ViewportPersistentListener
{
    private displayModeSwitchTimer: number | null;
    private updateStopwatch = new Stopwatch();
    private needsUpdate = false;

    constructor(props: ViewportProps)
    {
        super(props);

        this.state = {
            loaded: false,
            switchingMode: false,
            arState: ARState.Inactive,
            arPlaying: false,
            actualDisplayMode: props.editorState.displayMode,
            profilingEnabled: false,
        };

        (window as any).enableProfiling = (e = true) => {
            this.setState({ profilingEnabled: e });
        };
    }

    componentDidMount()
    {
        this.props.persistent.mount(this);
        this.props.persistent.ar.onChangeState.connect(this.handleChangeARState);
        this.needsUpdate = true;
    }

    componentWillUnmount()
    {
        this.props.persistent.ar.onChangeState.disconnect(this.handleChangeARState);
        this.props.persistent.unmount();

        if (this.displayModeSwitchTimer != null) {
            window.clearTimeout(this.displayModeSwitchTimer);
            this.displayModeSwitchTimer = null;
        }
    }

    componentDidUpdate(prevProps: ViewportProps, prevState: State): void
    {
        if (this.props.persistent !== prevProps.persistent) {
            throw new Error("Does not support replacing ViewportPersistent");
        }

        // Trigger render
        this.updateStopwatch.reset();

        if (this.props.editorState.displayMode !== prevProps.editorState.displayMode) {
            const {editorState, persistent} = this.props;

            if (editorState.displayMode == DisplayMode.AR) {
                persistent.ar.tryActivate();
                if (persistent.ar.activeState) {
                    // If AR is already active, then restart it.
                    persistent.ar.activeState.play();
                }
            } else {
                if (persistent.ar.activeState) {
                    persistent.ar.activeState.stop();
                }
            }

            // Delay the actual switch so we can have a time to fade out the viewport
            const newMode = this.props.editorState.displayMode;
            this.setState({ switchingMode: true });
            if (this.displayModeSwitchTimer != null) {
                window.clearTimeout(this.displayModeSwitchTimer);
            }
            this.displayModeSwitchTimer = window.setTimeout(() => {
                this.setState({
                    actualDisplayMode: newMode,
                    switchingMode: false,
                });
            }, 200);
        }
    }

    @bind
    private handleChangeARState(): void
    {
        const {ar} = this.props.persistent;
        this.setState({
            arState: ar.state,
            arPlaying: ar.activeState != null && ar.activeState.isPlaying,
        });
    }

    /// Required to implement `ViewportPersistentListener`
    handleNeedsUpdate(): void { this.needsUpdate = true; }

    /// Required to implement `ViewportPersistentListener`
    handleEditorStateUpdate(reducer: (oldState: EditorState) => EditorState): void
    {
        this.props.onChangeEditorState(reducer);
    }

    /// Required to implement `ViewportPersistentListener`
    handleInputDeviceDetected(type: 'touch' | 'mouse'): void
    {
        this.props.onChangeEditorState(state => {
            if (!state.inputDevicesInUse[type]) {
                // The presence of a mouse was detected
                return {
                    ... state,
                    inputDevicesInUse: {
                        ... this.props.editorState.inputDevicesInUse,
                        [type]: true,
                    },
                };
            } else {
                return state;
            }
        });
    }

    /// Required to implement `ViewportPersistentListener`
    get editorState(): EditorState { return this.props.editorState; }

    /// Required to implement `ViewportPersistentListener`
    get actualDisplayMode(): DisplayMode { return this.state.actualDisplayMode; }

    /// Required to implement `ViewportPersistentListener`
    get profilingEnabled(): boolean { return this.state.profilingEnabled; }

    @bind
    private update(): void
    {
        const {persistent} = this.props;

        let needsToUpdate = false;

        if (!this.state.switchingMode) {
            if (this.state.actualDisplayMode == DisplayMode.Normal) {
                // Stop updating on inactivity to reduce the power consumption
                needsToUpdate = this.updateStopwatch.elapsed < 5000;
            } else if (this.state.actualDisplayMode == DisplayMode.AR) {
                // Poll `ARMain` and re-render only if we get a new data
                if (persistent.ar.activeState) {
                    needsToUpdate = persistent.ar.activeState.update();
                }
            }
        }

        if (!this.state.loaded) {
            // Warm up shaders
            needsToUpdate = true;
        }

        if (this.needsUpdate) {
            // Requested by `ViewportPersistent`
            needsToUpdate = true;
            this.needsUpdate = false;
        }

        persistent.update(needsToUpdate);

        if (persistent.isShadersReady && !this.state.loaded) {
            // All shaders should be ready now
            this.setState({ loaded: true });
        }
    }

    @bind
    private handleMouseEnter(): void
    {
        this.props.onChangeEditorState(state => ({
            ... state,
            viewportHot: true,
        }));
    }

    @bind
    private handleMouseLeave(): void
    {
        this.props.onChangeEditorState(state => ({
            ... state,
            viewportHot: false,
        }));
    }

    render()
    {
        const {props, state} = this;
        const {ar} = props.persistent;

        const canvasVisible = this.state.loaded &&
            state.actualDisplayMode == DisplayMode.Normal ||
            state.arState == ARState.Active;

        return <div
            className={classNames.wrapper}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}>
            <RequestAnimationFrame
                onUpdate={this.update} />
            <Port
                element={props.persistent.canvas}
                className={classNames.port +
                       (canvasVisible ? ' ' + classNames.loaded : '') +
                       (this.state.switchingMode && canvasVisible ? ' ' + classNames.fadeOut : '')} />
            {
                state.actualDisplayMode == DisplayMode.AR &&
                state.arState == ARState.Error &&
                <div className={classNames.arError}>
                    <p>
                        Could not initialize the camera input.
                    </p>
                </div>
            }
        </div>;
    }
}
