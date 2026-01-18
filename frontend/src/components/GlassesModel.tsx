import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface GlassesModelHandle {
    setScale: (scale: number) => void;
    setRotation: (x: number, y: number, z: number) => void;
}

const GlassesModel = forwardRef<GlassesModelHandle>((_, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF('/glasses_v2.glb');

    useImperativeHandle(ref, () => ({
        setScale: (scale: number) => {
            if (groupRef.current) {
                groupRef.current.scale.setScalar(scale);
            }
        },
        setRotation: (x: number, y: number, z: number) => {
            if (groupRef.current) {
                groupRef.current.rotation.set(x, y, z);
            }
        }
    }));

    useEffect(() => {
        // Initial state: full scale (sliding animation, not scaling)
        if (groupRef.current) {
            groupRef.current.scale.setScalar(4);
        }
    }, []);

    return (
        <group ref={groupRef}>
            <primitive object={scene} />
        </group>
    );
});

GlassesModel.displayName = 'GlassesModel';

export default GlassesModel;

// Preload the model
useGLTF.preload('/glasses_v2.glb');
