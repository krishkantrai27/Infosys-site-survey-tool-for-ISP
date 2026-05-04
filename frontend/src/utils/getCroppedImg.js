export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

export default async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    // Set canvas size to match the bounding box
    canvas.width = image.width
    canvas.height = image.height

    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0)

    // Extract the cropped image data
    const croppedCanvas = document.createElement('canvas')
    const croppedCtx = croppedCanvas.getContext('2d')

    if (!croppedCtx) {
        return null
    }

    croppedCanvas.width = pixelCrop.width
    croppedCanvas.height = pixelCrop.height

    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    // Return as a blob
    return new Promise((resolve) => {
        croppedCanvas.toBlob((file) => {
            resolve(file)
        }, 'image/jpeg')
    })
}
