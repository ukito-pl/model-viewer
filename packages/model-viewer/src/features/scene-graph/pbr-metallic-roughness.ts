/* @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {MeshStandardMaterial, Texture as ThreeTexture} from 'three';

import {GLTF, PBRMetallicRoughness as GLTFPBRMetallicRoughness} from '../../three-components/gltf-instance/gltf-2.0.js';

import {PBRMetallicRoughness as PBRMetallicRoughnessInterface, RGBA} from './api.js';
import {TextureInfo, TextureUsage} from './texture-info.js';
import {$correlatedObjects, $onUpdate, $sourceObject, ThreeDOMElement} from './three-dom-element.js';



const $threeMaterials = Symbol('threeMaterials');
const $baseColorTexture = Symbol('baseColorTexture');
const $metallicRoughnessTexture = Symbol('metallicRoughnessTexture');

/**
 * PBR material properties facade implementation for Three.js materials
 */
export class PBRMetallicRoughness extends ThreeDOMElement implements
    PBRMetallicRoughnessInterface {
  private[$baseColorTexture]: TextureInfo;
  private[$metallicRoughnessTexture]: TextureInfo;

  private get[$threeMaterials](): Set<MeshStandardMaterial> {
    return this[$correlatedObjects] as Set<MeshStandardMaterial>;
  }

  constructor(
      onUpdate: () => void, gltf: GLTF,
      pbrMetallicRoughness: GLTFPBRMetallicRoughness,
      correlatedMaterials: Set<MeshStandardMaterial>) {
    super(onUpdate, pbrMetallicRoughness, correlatedMaterials);

    // Assign glTF default values
    if (pbrMetallicRoughness.baseColorFactor == null) {
      pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
    }
    if (pbrMetallicRoughness.roughnessFactor == null) {
      pbrMetallicRoughness.roughnessFactor = 1;
    }
    if (pbrMetallicRoughness.metallicFactor == null) {
      pbrMetallicRoughness.metallicFactor = 1;
    }

    let {
      baseColorTexture: gltfBaseColorTexture,
      metallicRoughnessTexture: gltfMetallicRoughnessTexture
    } = pbrMetallicRoughness;

    let baseColorTexture: ThreeTexture|null = null;
    let metallicRoughnessTexture: ThreeTexture|null = null;

    const {map, metalnessMap} = correlatedMaterials.values().next().value;

    if (map != null && gltfBaseColorTexture != null) {
      baseColorTexture = map;
    } else {
      gltfBaseColorTexture = {index: -1};
    }

    if (metalnessMap != null && gltfMetallicRoughnessTexture != null) {
      metallicRoughnessTexture = metalnessMap;
    } else {
      gltfMetallicRoughnessTexture = {index: -1};
    }

    const message = (textureType: string) => {
      console.info(`A group of three.js materials are represented as a
        single material but share different ${textureType} textures.`);
    };
    for (const material of correlatedMaterials) {
      const verifyMap = material.map ?? null;
      const verifyMetalnessMap = material.metalnessMap ?? null;
      if (baseColorTexture !== verifyMap) {
        message('base');
      }
      if (metallicRoughnessTexture !== verifyMetalnessMap) {
        message('metalness');
      }
    }

    this[$baseColorTexture] = new TextureInfo(
        onUpdate,
        gltf,
        correlatedMaterials,
        baseColorTexture,
        TextureUsage.Base,
        gltfBaseColorTexture!);

    this[$metallicRoughnessTexture] = new TextureInfo(
        onUpdate,
        gltf,
        correlatedMaterials,
        metallicRoughnessTexture,
        TextureUsage.Metallic,
        gltfMetallicRoughnessTexture!);
  }


  get baseColorFactor(): RGBA {
    return (this[$sourceObject] as GLTFPBRMetallicRoughness).baseColorFactor!;
  }

  get metallicFactor(): number {
    return (this[$sourceObject] as GLTFPBRMetallicRoughness).metallicFactor!;
  }

  get roughnessFactor(): number {
    return (this[$sourceObject] as GLTFPBRMetallicRoughness).roughnessFactor!;
  }

  get baseColorTexture(): TextureInfo {
    return this[$baseColorTexture];
  }

  get metallicRoughnessTexture(): TextureInfo {
    return this[$metallicRoughnessTexture];
  }

  setBaseColorFactor(rgba: RGBA) {
    for (const material of this[$threeMaterials]) {
      material.color.fromArray(rgba);
      material.opacity = (rgba)[3];
    }
    const pbrMetallicRoughness =
        this[$sourceObject] as GLTFPBRMetallicRoughness;
    pbrMetallicRoughness.baseColorFactor = rgba;
    this[$onUpdate]();
  }

  setMetallicFactor(value: number) {
    for (const material of this[$threeMaterials]) {
      material.metalness = value;
    }
    const pbrMetallicRoughness =
        this[$sourceObject] as GLTFPBRMetallicRoughness;
    pbrMetallicRoughness.metallicFactor = value;
    this[$onUpdate]();
  }

  setRoughnessFactor(value: number) {
    for (const material of this[$threeMaterials]) {
      material.roughness = value;
    }
    const pbrMetallicRoughness =
        this[$sourceObject] as GLTFPBRMetallicRoughness;
    pbrMetallicRoughness.roughnessFactor = value;
    this[$onUpdate]();
  }
}
