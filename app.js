    let audioContext, analyser, dataArray, canvas, ctx;

    const notes = [
      { note: "E2", freq: 82.41 },
      { note: "A2", freq: 110.00 },
      { note: "D3", freq: 146.83 },
      { note: "G3", freq: 196.00 },
      { note: "B3", freq: 246.94 },
      { note: "E4", freq: 329.63 }
    ];

    function startTuner() {
        const boton = document.getElementById("boton");
        boton.classList.add("active");
        
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        dataArray = new Float32Array(analyser.fftSize);
        source.connect(analyser);

        canvas = document.getElementById("tunerCanvas");
        ctx = canvas.getContext("2d");

        detectPitch();
      });
    }

    function detectPitch() {
      analyser.getFloatTimeDomainData(dataArray);
      const freq = autoCorrelate(dataArray, audioContext.sampleRate);

      if (freq !== -1) {
        document.getElementById("freq").innerText = freq.toFixed(2) + " Hz";
        let closest = findClosestNote(freq);
        document.getElementById("note").innerText = closest.note;

        drawTuner(freq, closest.freq, closest);
      }
      requestAnimationFrame(detectPitch);
    }

    // 🔥 Nuevo diseño visual del afinador (modo cuerdas)
    function drawTuner(freq, targetFreq, closestNote) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const stringSpacing = 30;
      const marginTop = 20;
      const stringCount = 6;
      const centerX = canvas.width / 2;

      // Dibujar las 6 cuerdas
      for (let i = 0; i < stringCount; i++) {
        ctx.beginPath();
        ctx.moveTo(20, marginTop + i * stringSpacing);
        ctx.lineTo(canvas.width - 20, marginTop + i * stringSpacing);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#555";
        ctx.stroke();
      }

      // Buscar cuerda activa
      const stringIndex = notes.findIndex(n => n.note === closestNote.note);

      if (stringIndex !== -1) {
        let y = marginTop + stringIndex * stringSpacing;
        let diff = freq - targetFreq;
        let maxRange = 20;
        let posX = centerX + (diff / maxRange) * (canvas.width / 2 - 30);
        posX = Math.max(30, Math.min(canvas.width - 30, posX));

        // Color según precisión
        const color =
          Math.abs(diff) < 1 ? "#00ff99" :
          Math.abs(diff) < 3 ? "#ffaa00" :
          "#ff4444";

        // Resaltar cuerda activa
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#aaa";
        ctx.stroke();

        // Indicador circular
        ctx.beginPath();
        ctx.arc(posX, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Nota en texto
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText(closestNote.note, 20, y - 10);
      }
    }

    function autoCorrelate(buf, sampleRate) {
      let SIZE = buf.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.01) return -1;

      let r1 = 0, r2 = SIZE - 1, thres = 0.2;
      for (let i = 0; i < SIZE/2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
      for (let i = 1; i < SIZE/2; i++) if (Math.abs(buf[SIZE-i]) < thres) { r2 = SIZE-i; break; }

      buf = buf.slice(r1, r2);
      SIZE = buf.length;

      let c = new Array(SIZE).fill(0);
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
          c[i] += buf[j] * buf[j + i];
        }
      }

      let d = 0; 
      while (c[d] > c[d + 1]) d++;
      let maxval = -1, maxpos = -1;
      for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
      }

      let T0 = maxpos;
      return sampleRate / T0;
    }

    function findClosestNote(freq) {
      return notes.reduce((prev, curr) =>
        Math.abs(curr.freq - freq) < Math.abs(prev.freq - freq) ? curr : prev
      );
    }