# LiteMapper
A website that automatically generates lights for Beat Saber maps!

## Basic Usage
1. Visit https://litemapper.net.
2. Upload your beatmap and press the **Generate** button.
3. Wait for it to finish compiling, then press the **Download** button.

## Advanced Usage
If you want to use this in any other scenario then opening the website, we offer a makeshift API service!
As we are completely serverless, we use URL query strings and then return the result as the data of the webpage.

### Parameters
- ``data``
Required to use the API. Should be the entire JSON of a beatmap file
- ``lightshow``
When set to ``true``, the API will return the level without any notes, bombs or obstacles. Otherwise, it returns the level as usual.

### Example
Here's how you could go about using the API in a JavaScript application:
```javascript
// have our beatmap json ready for usage
const beatmap = {"_notes" : [...]}

// use litemapper to generate full level
fetch("https://litemapper.net?data=" + JSON.stringify(beatmap)).then(res => res.json()).then(data => {
    if (data.error) throw new Error(data.errorMessage);
    const fullLevel = data;
})

// use litemapper to generate a lightshow
fetch("https://litemapper.net?lightshow=true&data=" + JSON.stringify(beatmap)).then(res => res.json()).then(data => {
    if (data.error) throw new Error(data.errorMessage);
    const lightshow = data;
})
```