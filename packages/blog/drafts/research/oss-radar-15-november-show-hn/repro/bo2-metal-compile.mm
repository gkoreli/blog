#import <Foundation/Foundation.h>
#import <Metal/Metal.h>
#include <cstdio>

int main(int argc, char** argv) {
    if (argc != 2) return 1;
    @autoreleasepool {
        id<MTLDevice> device = MTLCreateSystemDefaultDevice();
        if (!device) { puts("NO_METAL_DEVICE"); return 2; }
        NSString* source = [NSString stringWithContentsOfFile:[NSString stringWithUTF8String:argv[1]] encoding:NSUTF8StringEncoding error:nil];
        NSError* error = nil;
        id<MTLLibrary> lib = [device newLibraryWithSource:source options:nil error:&error];
        if (!lib) { fprintf(stderr, "%s\n", [[error localizedDescription] UTF8String]); return 3; }
        id<MTLFunction> function = [lib newFunctionWithName:@"xlatMtlMain"];
        if (!function) return 4;
        puts("METAL_LIBRARY_AND_VERTEX_FUNCTION_CREATED");
        return 0;
    }
}
