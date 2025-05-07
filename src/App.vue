<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { onMounted, ref } from 'vue';

let canvasDom = ref(null);
let controls;
let wheels = [];
let carbody, glassCar;
let gridHelper;
let lights = []; // 添加光源数组
let maybachLights = []; // 添加迈巴赫专属光源数组

// 控制状态
const activeButton = ref('su7'); // 当前激活的按钮
const showColorPanel = ref(false); // 是否显示颜色面板
const showModelInfo = ref(true); // 修改为默认显示
const showColorWheel = ref(false); // 是否显示RGB颜色轮盘
const customColor = ref('#ffffff'); // 自定义颜色
const showCarMenu = ref(false);
const currentCar = ref('奔驰AMG GT');
const isAMGSelected = ref(true); // 添加新的状态来跟踪是否选择了AMG

// 颜色相关
const currentBodyColor = ref('#5f92a7');
const currentWheelColor = ref('#1A1A1A');

// 预设颜色
const bodyColors = [
    { color: '#5f92a7', name: '天蓝色' },
    { color: '#FF0000', name: '激情红' },
    { color: '#FFD700', name: '流光金' },
    { color: '#FFFFFF', name: '珍珠白' },
    { color: '#1A1A1A', name: '曜石黑' },
    { color: '#800080', name: '梦幻紫' },
    { color: '#FFA500', name: '日落橙' },
    { color: '#90EE90', name: '青柠绿' }
];

const wheelColors = [
    { color: '#1A1A1A', name: '曜石黑' },
    { color: '#C0C0C0', name: '银石灰' },
    { color: '#FFD700', name: '流光金' },
    { color: '#B87333', name: '古铜色' },
    { color: '#4A4A4A', name: '深空灰' }
];

// 添加颜色选择相关的状态
const tempCustomColor = ref('#ffffff');
const isCustomizing = ref(false);

const carModels = [
    { 
        name: '奔驰AMG GT', 
        value: 'amg',
        modelPath: 'models/benz_AMG_GT/scene.gltf',
        info: {
            top: '奔驰 AMG GT',
            right: '最大功率：585马力',
            left: '百公里加速：3.6s',
            bottom: '4.0T V8发动机'
        }
    },
    { 
        name: '小米SU7', 
        value: 'su7',
        modelPath: 'models/su7/scene.gltf',
        info: {
            top: '小米 SU7',
            right: '最高续航里程：800km',
            left: '百公里加速：2.9s',
            bottom: '800V超快充平台'
        }
    },
    { 
        name: '迈巴赫', 
        value: 'maybach',
        modelPath: 'models/benz_maybach_2022/scene.gltf',
        info: {
            top: '迈巴赫 S680',
            right: '6.0T V12发动机',
            left: '最大功率：630马力',
            bottom: '极致奢华内饰'
        }
    }
];

const currentCarInfo = ref(carModels[0].info); 

// 按钮点击处理函数
const handleButtonClick = (button) => {
    if (activeButton.value === button) {
        activeButton.value = '';
        showColorPanel.value = false;
        showModelInfo.value = true;
        showColorWheel.value = false;
        showCarMenu.value = false;
    } else {
        activeButton.value = button;
        showColorPanel.value = ['wheelColor', 'bodyColor'].includes(button);
        showModelInfo.value = button !== 'su7';
        showColorWheel.value = button === 'customize';
        showCarMenu.value = button === 'su7';
    }
};

// 颜色选择函数
const selectBodyColor = (color) => {
    currentBodyColor.value = color;
    if (carbody) {
        carbody.material.color = new THREE.Color(color);
    }
};

const selectWheelColor = (color) => {
    currentWheelColor.value = color;
    wheels.forEach(wheel => {
        wheel.material.color = new THREE.Color(color);
    });
};

const selectCar = (car) => {
    currentCar.value = car.name;
    currentCarInfo.value = car.info;
    showCarMenu.value = false;
    isAMGSelected.value = car.value === 'amg';
    // 预留模型切换位置
    switchModel(car.value);
};

// 预留模型切换函数
const switchModel = (modelType) => {
    // 清除迈巴赫专属光源
    maybachLights.forEach(light => {
        scene.remove(light);
    });
    maybachLights = [];
    
    const carModel = carModels.find(car => car.value === modelType);
    if (carModel) {
        console.log('Loading model:', carModel.modelPath);
        loadModel(carModel.modelPath);
        
        // 如果是迈巴赫，添加额外光源
        if (modelType === 'maybach') {
            // 添加太阳光效果
            const sunLight = new THREE.DirectionalLight(0xffffff, 2);
            sunLight.position.set(5, 10, 5);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 50;
            sunLight.shadow.camera.left = -10;
            sunLight.shadow.camera.right = 10;
            sunLight.shadow.camera.top = 10;
            sunLight.shadow.camera.bottom = -10;
            scene.add(sunLight);
            maybachLights.push(sunLight);
            
            // 添加环境光
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            maybachLights.push(ambientLight);
            
            // 添加补光
            const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
            fillLight1.position.set(-5, 5, -5);
            scene.add(fillLight1);
            maybachLights.push(fillLight1);
            
            const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
            fillLight2.position.set(0, 5, 5);
            scene.add(fillLight2);
            maybachLights.push(fillLight2);
            
            // 添加地面反射光
            const groundLight = new THREE.DirectionalLight(0xffffff, 0.4);
            groundLight.position.set(0, -5, 0);
            scene.add(groundLight);
            maybachLights.push(groundLight);
            
            // 添加车顶聚光灯
            const roofSpotLight = new THREE.SpotLight(0xffffff, 2);
            roofSpotLight.position.set(0, 3, 0);
            roofSpotLight.angle = Math.PI / 6;
            roofSpotLight.penumbra = 0.5;
            roofSpotLight.decay = 2;
            roofSpotLight.distance = 50;
            roofSpotLight.castShadow = true;
            scene.add(roofSpotLight);
            maybachLights.push(roofSpotLight);
            
            // 添加车头灯效果
            const headLight1 = new THREE.SpotLight(0xffffff, 1.5);
            headLight1.position.set(1, 0.5, 2);
            headLight1.angle = Math.PI / 8;
            headLight1.penumbra = 0.5;
            headLight1.decay = 2;
            headLight1.distance = 20;
            scene.add(headLight1);
            maybachLights.push(headLight1);
            
            const headLight2 = new THREE.SpotLight(0xffffff, 1.5);
            headLight2.position.set(-1, 0.5, 2);
            headLight2.angle = Math.PI / 8;
            headLight2.penumbra = 0.5;
            headLight2.decay = 2;
            headLight2.distance = 20;
            scene.add(headLight2);
            maybachLights.push(headLight2);
            
            // 添加车尾灯效果
            const tailLight1 = new THREE.PointLight(0xff0000, 0.8);
            tailLight1.position.set(0.5, 0.5, -2);
            scene.add(tailLight1);
            maybachLights.push(tailLight1);
            
            const tailLight2 = new THREE.PointLight(0xff0000, 0.8);
            tailLight2.position.set(-0.5, 0.5, -2);
            scene.add(tailLight2);
            maybachLights.push(tailLight2);
        }
    }
};

// 修改loadModel函数
const loadModel = (modelPath) => {
    // 清除现有模型，但保留光源和网格辅助线
    scene.children.forEach(child => {
        if (child !== camera && 
            child !== controls.object && 
            child !== gridHelper && 
            !lights.includes(child) &&
            !maybachLights.includes(child)) {
            scene.remove(child);
        }
    });
    
    // 重置材质数组和引用
    wheels = [];
    carbody = null;
    
    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0);
            scene.add(model);
            
            model.traverse((child) => {
                if (child.isMesh) {
                    // 判断是否为车身
                    if (child.name.includes('CarPaint') || 
                        child.name.includes('Body') || 
                        child.name.includes('car_body') ||
                        child.name.includes('AMG_GT_Body') ||
                        child.name.includes('AMG_GT') ||
                        child.name.includes('body')) {
                        carbody = child;
                        carbody.material = bodyMaterial;
                        // 应用当前选择的颜色
                        if (currentBodyColor.value) {
                            carbody.material.color = new THREE.Color(currentBodyColor.value);
                        }
                    }
                    // 判断是否为轮毂
                    if (child.name.includes('Rim') || 
                        child.name.includes('Wheel') || 
                        child.name.includes('wheel') ||
                        child.name.includes('AMG_GT_Wheel') ||
                        child.name.includes('rim')) {
                        wheels.push(child);
                        wheels.forEach(wheel => {
                            wheel.material = wheelsMaterial;
                            // 应用当前选择的轮毂颜色
                            if (currentWheelColor.value) {
                                wheel.material.color = new THREE.Color(currentWheelColor.value);
                            }
                        });
                    }
                }
            });
            
            // 更新车辆信息显示
            showModelInfo.value = true;
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading model:', error);
        }
    );
};

// 重置函数
const resetAll = () => {
    if (carbody) {
        carbody.material.color = new THREE.Color('#5f92a7');
    }
    wheels.forEach(wheel => {
        wheel.material.color = new THREE.Color('#1A1A1A');
    });
    currentBodyColor.value = '#5f92a7';
    currentWheelColor.value = '#1A1A1A';
    activeButton.value = '';
    showColorPanel.value = false;
    showModelInfo.value = true;
    showColorWheel.value = false;
    showCarMenu.value = false;
    isAMGSelected.value = true; // 重置时选择AMG
    currentCar.value = '奔驰AMG GT';
    currentCarInfo.value = carModels[0].info;
    switchModel('amg');
};

// 创建材质
const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x5f92a7, // 天蓝色
    metalness: 1,
    roughness: 0.65,
    clearcoat: 1,
    clearcoatRoughness: 0,
});
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, // 白色
    metalness: 0,
    roughness: 0,
    transmission: 1,
    transparent: true,
});
const wheelsMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff0000, // 红色
    metalness: 1,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0,
});
// 车身颜色选择
let selectColor = (index) => {
    carbody.material.color = new THREE.Color(colors[index]);
}
// 车身部分
// 切换车漆效果的函数
const togglePaintEffect = () => {
    isMatte.value =!isMatte.value;
    if (isMatte.value) {
        // 开启磨砂车漆效果，调整相关属性
        carbody.material.roughness = 1;
        carbody.material.clearcoat = 0;
    } else {
        // 关闭磨砂车漆效果，恢复属性
        carbody.material.roughness = 0.8;
        carbody.material.clearcoat = 0.7;
    }
};
// 切换面板展开状态的函数
const togglePanel = () => {
    isPanelOpen.value =!isPanelOpen.value;
};
// 轮毂部分
// 切换轮毂设置面板展开状态的函数
const toggleWheelPanel = () => {
    isWheelPanelOpen.value =!isWheelPanelOpen.value;
};
// 创建场景
const scene = new THREE.Scene();
// 创建相机
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 1, 5);
// 创建渲染器
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// 添加窗口大小变化监听
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 修改render函数
const render = () => {
    renderer.render(scene, camera);
    controls && controls.update();
    // 设定一个较小的固定半径
    const radius = 3; 
    const angle = Math.atan2(camera.position.x, camera.position.z);
    const newAngle = angle + 0.001;
    camera.position.x = radius * Math.sin(newAngle);
    camera.position.z = radius * Math.cos(newAngle);
    camera.lookAt(scene.position);
    requestAnimationFrame(render);
}
onMounted(() => {
    // 确保canvas容器占满整个视口
    canvasDom.value.style.width = '100vw';
    canvasDom.value.style.height = '100vh';
    canvasDom.value.style.position = 'fixed';
    canvasDom.value.style.top = '0';
    canvasDom.value.style.left = '0';
    
    canvasDom.value.appendChild(renderer.domElement);
    // 初始化渲染器,渲染背景
    renderer.setClearColor("#000");
    scene.background = new THREE.Color("#111111"); // 更暗的背景色
    scene.environment = new THREE.Color("#111111");
    
    // 设置渲染器尺寸
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    render();
    
    // 创建地板几何体
    const floorGeometry = new THREE.PlaneGeometry(25, 25);
    // 创建纹理加载器
    const textureLoader = new THREE.TextureLoader();
    // 加载地板材质图片
    const floorTexture = textureLoader.load(
        'texture/road.jpg',
        () => {
            console.log('地板材质图片加载成功');
            // 设置纹理重复
            floorTexture.repeat.set(2, 2);
            floorTexture.wrapS = THREE.RepeatWrapping;
            floorTexture.wrapT = THREE.RepeatWrapping;
            // 创建地板材质
            const floorMaterial = new THREE.MeshStandardMaterial({ 
                map: floorTexture, 
                side: THREE.DoubleSide,
                roughness: 0.9, // 增加粗糙度
                metalness: 0.1, // 降低金属度
                color: 0x444444 // 更暗的基础颜色
            });
            // 创建地板对象
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, -0.1, 0);
            scene.add(floor);
        },
        undefined,
        (error) => {
            console.error('地板材质图片加载失败:', error);
        }
    );

    // 添加控制器
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.update();

    // 清除现有光源
    lights.forEach(light => scene.remove(light));
    lights = [];

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // 添加展厅长条灯
    // 前方长条灯
    const frontRectLight = new THREE.RectAreaLight(0xffffff, 5, 8, 2);
    frontRectLight.position.set(0, 5, 8);
    frontRectLight.lookAt(0, 0, 0);
    scene.add(frontRectLight);
    lights.push(frontRectLight);

    // 后方长条灯
    const backRectLight = new THREE.RectAreaLight(0xffffff, 5, 8, 2);
    backRectLight.position.set(0, 5, -8);
    backRectLight.lookAt(0, 0, 0);
    scene.add(backRectLight);
    lights.push(backRectLight);

    // 左侧长条灯
    const leftRectLight = new THREE.RectAreaLight(0xffffff, 5, 8, 2);
    leftRectLight.position.set(-8, 5, 0);
    leftRectLight.lookAt(0, 0, 0);
    scene.add(leftRectLight);
    lights.push(leftRectLight);

    // 右侧长条灯
    const rightRectLight = new THREE.RectAreaLight(0xffffff, 5, 8, 2);
    rightRectLight.position.set(8, 5, 0);
    rightRectLight.lookAt(0, 0, 0);
    scene.add(rightRectLight);
    lights.push(rightRectLight);

    // 添加额外的长条灯
    // 左前方长条灯
    const leftFrontRectLight = new THREE.RectAreaLight(0xffffff, 4, 6, 2);
    leftFrontRectLight.position.set(-6, 4, 6);
    leftFrontRectLight.lookAt(0, 0, 0);
    scene.add(leftFrontRectLight);
    lights.push(leftFrontRectLight);

    // 右前方长条灯
    const rightFrontRectLight = new THREE.RectAreaLight(0xffffff, 4, 6, 2);
    rightFrontRectLight.position.set(6, 4, 6);
    rightFrontRectLight.lookAt(0, 0, 0);
    scene.add(rightFrontRectLight);
    lights.push(rightFrontRectLight);

    // 左后方长条灯
    const leftBackRectLight = new THREE.RectAreaLight(0xffffff, 4, 6, 2);
    leftBackRectLight.position.set(-6, 4, -6);
    leftBackRectLight.lookAt(0, 0, 0);
    scene.add(leftBackRectLight);
    lights.push(leftBackRectLight);

    // 右后方长条灯
    const rightBackRectLight = new THREE.RectAreaLight(0xffffff, 4, 6, 2);
    rightBackRectLight.position.set(6, 4, -6);
    rightBackRectLight.lookAt(0, 0, 0);
    scene.add(rightBackRectLight);
    lights.push(rightBackRectLight);

    // 添加顶部主光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(0, 10, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);
    lights.push(mainLight);

    // 添加顶部聚光灯
    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(0, 8, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 50;
    scene.add(spotLight);
    lights.push(spotLight);

    // 添加地面反射光
    const groundLight = new THREE.DirectionalLight(0xffffff, 0.3);
    groundLight.position.set(0, -5, 0);
    scene.add(groundLight);
    lights.push(groundLight);

    // 添加装饰性点光源
    // 左前方点光源
    const leftFrontPointLight = new THREE.PointLight(0xffffff, 0.8, 10);
    leftFrontPointLight.position.set(-5, 3, 5);
    scene.add(leftFrontPointLight);
    lights.push(leftFrontPointLight);

    // 右前方点光源
    const rightFrontPointLight = new THREE.PointLight(0xffffff, 0.8, 10);
    rightFrontPointLight.position.set(5, 3, 5);
    scene.add(rightFrontPointLight);
    lights.push(rightFrontPointLight);

    // 左后方点光源
    const leftBackPointLight = new THREE.PointLight(0xffffff, 0.8, 10);
    leftBackPointLight.position.set(-5, 3, -5);
    scene.add(leftBackPointLight);
    lights.push(leftBackPointLight);

    // 右后方点光源
    const rightBackPointLight = new THREE.PointLight(0xffffff, 0.8, 10);
    rightBackPointLight.position.set(5, 3, -5);
    scene.add(rightBackPointLight);
    lights.push(rightBackPointLight);

    // 添加彩色氛围灯
    const blueLight = new THREE.PointLight(0x0088ff, 0.5, 15);
    blueLight.position.set(-8, 2, 0);
    scene.add(blueLight);
    lights.push(blueLight);

    const redLight = new THREE.PointLight(0xff0000, 0.5, 15);
    redLight.position.set(8, 2, 0);
    scene.add(redLight);
    lights.push(redLight);

    // 初始化时加载默认模型并显示信息
    loadModel('./models/benz_AMG_GT/scene.gltf');
    showModelInfo.value = true;
    currentCarInfo.value = carModels[0].info;
});

// 修改自定义颜色选择函数
const handleCustomColorChange = (event) => {
    tempCustomColor.value = event.target.value;
};

// 添加确认颜色函数
const confirmCustomColor = () => {
    if (carbody) {
        carbody.material.color = new THREE.Color(tempCustomColor.value);
    }
    isCustomizing.value = false;
    showColorWheel.value = false;
};

// 取消颜色选择
const cancelCustomColor = () => {
    tempCustomColor.value = '#ffffff';
    isCustomizing.value = false;
    showColorWheel.value = false;
};

</script>


<template>
    <div class="home">
        <div class="canvas-container" ref="canvasDom"></div>
        
        <!-- 底部控制面板 -->
        <div class="bottom-panel">
            <div class="control-section">
                <!-- 重置按钮 -->
                <div v-if="isAMGSelected" class="control-item" 
                    :class="{ active: activeButton === 'reset' }"
                    @click="resetAll">
                    <span>重置</span>
                    <div class="progress-bar"></div>
                </div>

                <!-- 轮毂颜色按钮 -->
                <div v-if="isAMGSelected" class="control-item" 
                    :class="{ active: activeButton === 'wheelColor' }"
                    @click="handleButtonClick('wheelColor')">
                    <span>轮毂颜色</span>
                    <div class="progress-bar"></div>
                    <!-- 轮毂颜色面板 -->
                    <div v-if="showColorPanel && activeButton === 'wheelColor'" class="color-panel">
                        <div v-for="item in wheelColors" 
                            :key="item.color"
                            class="color-item"
                            :class="{ active: currentWheelColor === item.color }"
                            @click.stop="selectWheelColor(item.color)">
                            <div class="color-dot" :style="{ backgroundColor: item.color }"></div>
                            <span class="color-name">{{ item.name }}</span>
                        </div>
                    </div>
                </div>

                <!-- 车身颜色按钮 -->
                <div v-if="isAMGSelected" class="control-item" 
                    :class="{ active: activeButton === 'bodyColor' }"
                    @click="handleButtonClick('bodyColor')">
                    <span>车身颜色</span>
                    <div class="progress-bar"></div>
                    <!-- 车身颜色面板 -->
                    <div v-if="showColorPanel && activeButton === 'bodyColor'" class="color-panel">
                        <div v-for="item in bodyColors" 
                            :key="item.color"
                            class="color-item"
                            :class="{ active: currentBodyColor === item.color }"
                            @click.stop="selectBodyColor(item.color)">
                            <div class="color-dot" :style="{ backgroundColor: item.color }"></div>
                            <span class="color-name">{{ item.name }}</span>
                        </div>
                    </div>
                </div>

                <!-- 车型选择按钮 -->
                <div class="control-item" 
                    :class="{ active: activeButton === 'su7' }"
                    @click="handleButtonClick('su7')">
                    <span>{{ currentCar }}</span>
                    <div class="progress-bar"></div>
                    <!-- 车型选择菜单 -->
                    <div v-if="showCarMenu" class="car-menu">
                        <div v-for="car in carModels" 
                            :key="car.value"
                            class="car-menu-item"
                            :class="{ active: currentCar === car.name }"
                            @click.stop="selectCar(car)">
                            <span>{{ car.name }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 车辆信息标签 -->
        <div v-if="showModelInfo" class="car-info-tags">
            <div class="info-tag top">{{ currentCarInfo.top }}</div>
            <div class="info-tag right">{{ currentCarInfo.right }}</div>
            <div class="info-tag left">{{ currentCarInfo.left }}</div>
            <div class="info-tag bottom">{{ currentCarInfo.bottom }}</div>
        </div>
    </div>
</template>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
}

.home {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    background: #000;
    color: white;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
}

.canvas-container {
    flex: 1;
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
}

/* 底部面板样式 */
.bottom-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 20px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 1000;
}

.control-section {
    display: flex;
    justify-content: center;
    gap: 60px;
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.control-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 10px 20px;
    border-radius: 8px;
    transition: all 0.3s ease;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.control-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.control-item.active {
    background: rgba(255, 255, 255, 0.15);
}

.control-item span {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    transition: color 0.3s;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.control-item:hover span,
.control-item.active span {
    color: white;
}

.progress-bar {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    transition: background-color 0.3s;
}

.control-item:hover .progress-bar,
.control-item.active .progress-bar {
    background: white;
}

/* 颜色面板样式 */
.color-panel {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 12px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-width: 300px;
}

.color-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    padding: 5px;
    border-radius: 8px;
    transition: all 0.3s ease;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.color-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

.color-dot {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s;
}

.color-item.active .color-dot {
    border-color: white;
    transform: scale(1.1);
}

.color-name {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.color-item.active .color-name {
    color: white;
}

/* 车辆信息标签样式 */
.car-info-tags {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.info-tag {
    position: absolute;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    font-size: 14px;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-tag.top {
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
}

.info-tag.right {
    right: 120px;
    top: 50%;
    transform: translateY(-50%);
}

.info-tag.left {
    left: 120px;
    top: 50%;
    transform: translateY(-50%);
}

.info-tag.bottom {
    bottom: 200px;
    left: 50%;
    transform: translateX(-50%);
}

/* 添加颜色选择器样式 */
.color-wheel-panel {
    position: absolute;
    right: -250px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    padding: 25px;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 220px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
}

.color-wheel-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.color-wheel-container h3 {
    color: white;
    font-size: 16px;
    margin: 0;
    text-align: center;
}

.color-preview {
    width: 120px;
    height: 80px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.color-value {
    color: white;
    font-size: 14px;
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    background: rgba(0, 0, 0, 0.3);
    padding: 4px 8px;
    border-radius: 4px;
}

.color-wheel-input {
    width: 100px;
    height: 100px;
    border: none;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    background: none;
}

.color-wheel-input::-webkit-color-swatch-wrapper {
    padding: 0;
}

.color-wheel-input::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
}

.color-actions {
    display: flex;
    gap: 10px;
    width: 100%;
}

.action-button {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.action-button.confirm {
    background: #4CAF50;
    color: white;
}

.action-button.confirm:hover {
    background: #45a049;
}

.action-button.cancel {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.action-button.cancel:hover {
    background: rgba(255, 255, 255, 0.2);
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translate(20px, -50%);
    }
    to {
        opacity: 1;
        transform: translate(0, -50%);
    }
}

/* 车型选择菜单样式 */
.car-menu {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    padding: 15px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-width: 150px;
    animation: slideDown 0.3s ease;
}

.car-menu-item {
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.car-menu-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.car-menu-item.active {
    background: rgba(255, 255, 255, 0.15);
    color: white;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translate(-50%, 10px);
    }
    to {
        opacity: 1;
        transform: translate(-50%, 0);
    }
}
</style>    