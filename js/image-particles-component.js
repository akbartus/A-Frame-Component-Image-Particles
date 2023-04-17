AFRAME.registerComponent('image-particles', {
    schema: {
      src: { type: 'string' },
      particleSize: { type: 'number', default: 5 },
      particleCount: { type: 'number', default: 2000 },
      particleColor: { type: 'color', default: '' }, // if blank or white, will show original colors
      particleOpacity: { type: 'number', default: 1 },
      particleSpeed: { type: 'number', default: 0.5 },
      particleSizeAttenuation: { type: 'boolean', default: true },
      particleMotionDuration: { type: 'number', default: 1 },
      particleDistance: { type: 'number', default: 200 },
      particleDelay: { type: 'number', default: 3 } // New property for delay
    },
    init: function () {
      let el = this.el;
      let data = this.data;
      let particleSystem = null; // Declare particleSystem letiable

      // Create a THREE.js geometry object to hold the particles
      let geometry = new THREE.BufferGeometry();

      // Load the image and get its pixel data
      let img = new Image();

      img.onload = function () {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        let imageData = context.getImageData(0, 0, img.width, img.height);

        // Iterate over each pixel in the image and create a particle for it if it's not transparent
        let positions = new Float32Array(data.particleCount * 3);
        let colors = new Float32Array(data.particleCount * 3);
        let opacities = new Float32Array(data.particleCount);
        let sizes = new Float32Array(data.particleCount);
        let velocities = new Float32Array(data.particleCount * 3);
        let timers = new Float32Array(data.particleCount); // New array to store timer values

        for (let i = 0; i < data.particleCount; i++) {
          velocities[i * 3] = Math.random() - 0.5;
          velocities[i * 3 + 1] = Math.random() - 0.5;
          positions[i * 3 + 2] = 0;
          timers[i] = Math.random() * data.particleMotionDuration; // Initialize the timer value randomly
        }

        let index = 0;

        for (let x = 0; x < imageData.width; x += data.particleSize) {
          for (let y = 0; y < imageData.height; y += data.particleSize) {
            let i = (y * imageData.width + x) * 4;

            if (index >= data.particleCount || imageData.data[i + 3] === 0) continue;

            positions[index * 3] = x - imageData.width / 2;
            positions[index * 3 + 1] = -y + imageData.height / 2;
            colors[index * 3] = imageData.data[i] / 255;
            colors[index * 3 + 1] = imageData.data[i + 1] / 255;
            colors[index * 3 + 2] = imageData.data[i + 2] / 255;
            opacities[index] = data.particleOpacity;
            sizes[index] = data.particleSize;
            index++;
          }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('timer', new THREE.BufferAttribute(timers, 1)); // Add timer attribute to the geometry

        // Create a THREE.js material for the particles
        let material = new THREE.PointsMaterial({
          vertexColors: true,
          size: data.particleSize,
          sizeAttenuation: data.particleSizeAttenuation,
          transparent: true,
          opacity: data.particleOpacity,
          color: new THREE.Color(data.particleColor)
        });

        // Create a THREE.js particle system object
        particleSystem = new THREE.Points(geometry, material); el.sceneEl.object3D.add(particleSystem); this.particleSystem = particleSystem;
      };

      img.src = data.src;

      // Create a THREE.js material for the particles
      let material = new THREE.PointsMaterial({
        vertexColors: true,
        size: data.particleSize,
        sizeAttenuation: data.particleSizeAttenuation,
        transparent: true,
        opacity: data.particleOpacity,
        color: new THREE.Color(data.particleColor)
      });

      // Create a THREE.js particle system object
      particleSystem = new THREE.Points(geometry, material);
      el.sceneEl.object3D.add(particleSystem);
      this.particleSystem = particleSystem;

      // Wait for the specified delay before starting particle motion
      setTimeout(function () {
        this.motionStarted = true;
      }.bind(this), data.particleDelay * 1000); // Convert delay to milliseconds
      

    },

    tick: function (time, deltaTime) {
      let data = this.data; 
      let velocities = this.particleSystem.geometry.attributes.velocity;

      if (velocities !== undefined && this.motionStarted) { // Check if motion has started
        let positions = this.particleSystem.geometry.attributes.position.array;
        let timers = this.particleSystem.geometry.attributes.timer.array; // Get the timer array
        let count = data.particleCount;
        let distance = data.particleDistance;

        for (let i = 0; i < count; i++) {
          let x = positions[i * 3];
          let y = positions[i * 3 + 1];
          let z = positions[i * 3 + 2];
          let vx = velocities.array[i * 3];
          let vy = velocities.array[i * 3 + 1];
          let vz = velocities.array[i * 3 + 2];
          let t = timers[i]; // Get the timer value

          // Update the position of the particle based on its velocity and speed
          x += vx * data.particleSpeed;
          y += vy * data.particleSpeed;

          // Move the particle back and forth when it reaches the edges of the canvas
          if (x < -distance || x > distance) {
            vx = -vx;
            
            x += vx * data.particleSpeed;
          }
          if (y < -distance || y > distance) {
            vy = -vy;
            y += vy * data.particleSpeed;

          }

          // Update the timer value and reverse the particle's direction if the timer has elapsed
          t += deltaTime / 1000; // Add the elapsed time since the last frame
          if (t > data.particleMotionDuration) {
          
            t = 0;

            vx = -vx;
            vy = -vy;
          }

          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
          velocities.array[i * 3] = vx;
          velocities.array[i * 3 + 1] = vy;
          velocities.array[i * 3 + 2] = vz;
          timers[i] = t; // Store the updated timer value
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        velocities.needsUpdate = true;
        timers.needsUpdate = true; // Update the timer attribute buffer
      }
    }
  });