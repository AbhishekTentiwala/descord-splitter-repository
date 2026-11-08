import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing";

const helpers = generateReactHelpers<OurFileRouter>({
  url: "/api/uploadthing",
});

export const { useUploadThing } = helpers;