/*
 * Copyright (c) 2017 ARcane Developers
 *
 * This file is a part of ARcane. Please read the license text that
 * comes with the source code for use conditions.
 */
import {
    ShaderModule, ShaderBuilder, ShaderModuleInstance,
    ShaderModuleFactory,
} from '../shadertk/shadertoolkit';

import { PieShaderModule, PieShaderChunk } from '../shadertk/pieglsl';
const pieModule: PieShaderModule = require('./constants.glsl');

export const ConstantsShaderModuleFactory: ShaderModuleFactory<ConstantsShaderModule> =
    (builder) => new ConstantsShaderModule(builder);

export class ConstantsShaderModule extends ShaderModule<PackShaderInstance, {}>
{
    private readonly pieChunk = new PieShaderChunk<{
        PI: string;
    }>(pieModule);

    readonly PI = this.pieChunk.bindings.PI;

    constructor(builder: ShaderBuilder)
    {
        super(builder);
        this.register();
    }

    emit() { return this.pieChunk.emit(); }
}

class PackShaderInstance extends ShaderModuleInstance<{}>
{
}