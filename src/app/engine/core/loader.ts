import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

const loadModel = (url: string): Promise<THREE.Group> => {
    return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            resolve(model);
        }, undefined, (error) => {
            console.error('An error occurred while loading the model:', error);
            reject(error);
        });
    });
}

const loadModelVertices = (url: string): Promise<THREE.BufferGeometry> => {
    return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
            const geometry = ((gltf.scene.children[0]) as any).geometry;
            resolve(geometry);
        }, undefined, (error) => {
            console.error('An error occurred while loading the model vertices:', error);
            reject(error);
        });
    });
}