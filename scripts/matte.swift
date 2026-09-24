import Foundation
import Vision
import CoreImage
import AppKit

// Cuts the subject out of each picture with the Vision framework, on this Mac.
let ctx = CIContext()
for path in CommandLine.arguments.dropFirst() {
    let url = URL(fileURLWithPath: path)
    guard let input = CIImage(contentsOf: url) else { print("cannot read \(path)"); continue }
    let handler = VNImageRequestHandler(ciImage: input)
    let request = VNGenerateForegroundInstanceMaskRequest()
    do {
        try handler.perform([request])
        guard let result = request.results?.first else { print("no subject in \(path)"); continue }
        let buffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
        let out = CIImage(cvPixelBuffer: buffer)
        let dest = url.deletingPathExtension().appendingPathExtension("cut.png")
        try ctx.writePNGRepresentation(of: out, to: dest, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
        print("cut \(dest.lastPathComponent)")
    } catch { print("failed \(path): \(error)") }
}
