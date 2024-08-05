import { streamGemini } from './gemini-api.js';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let imageInput = document.querySelector('input[name="image_prompt"]');
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    let imageBase64 = null;
    if (imageInput.files.length > 0) {
      let imageFile = imageInput.files[0];
      imageBase64 = await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    }

    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: promptInput.value }
        ]
      }
    ];

    let formData = new FormData();
    formData.append('model', 'gemini-1.5-flash'); // or gemini-1.5-pro
    formData.append('contents', JSON.stringify(contents));
    if (imageInput.files.length > 0) {
      formData.append('image_prompt', imageInput.files[0]);
    }

    let response = await fetch('/api/generate', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Network response was not ok');
    let reader = response.body.getReader();
    let decoder = new TextDecoder();
    let buffer = [];
    let md = new markdownit();

    while (true) {
      let { done, value } = await reader.read();
      if (done) break;
      let text = decoder.decode(value, { stream: true });
      buffer.push(text);
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

