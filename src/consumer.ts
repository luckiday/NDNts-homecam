import { Endpoint } from "@ndn/endpoint";
import { Version } from "@ndn/naming-convention2";
import { Name } from "@ndn/packet";
import { retrieveMetadata } from "@ndn/rdr";
import { fetch, RttEstimator } from "@ndn/segmented-object";

import { getState } from "./connect";

const endpoint = new Endpoint({ retx: 2 });
const rtte = new RttEstimator();
let streamPrefix: Name;
let $img: HTMLImageElement;
let $message: HTMLParagraphElement;
let lastImageName = new Name();
let lastObjectUrl = "";

async function retrieveImage() {
  const { name: imageName } = await retrieveMetadata(streamPrefix, { endpoint });
  if (imageName.equals(lastImageName)) {
    return;
  }
  lastImageName = imageName;

  const imageBuffer = await fetch.promise(imageName, { endpoint, rtte });
  const objectUrl = URL.createObjectURL(new Blob([imageBuffer]));
  $img.src = objectUrl;
  if (lastObjectUrl) {
    URL.revokeObjectURL(lastObjectUrl);
  }
  lastObjectUrl = objectUrl;
  $message.textContent = `Retrieved: ${imageName.at(-1).as(Version)}`;
}

async function reloadImage() {
  try {
    await retrieveImage();
  } catch (err) {
    $message.textContent = String(err);
  } finally {
    setTimeout(reloadImage, 200);
  }
}

export function startConsumer(id: string) {
  const { sysPrefix } = getState();
  streamPrefix = sysPrefix.append(id, "image");
  $img = document.querySelector("#c_img") as HTMLImageElement;
  $message = document.querySelector("#c_message") as HTMLParagraphElement;
  setTimeout(reloadImage, 200);

  document.querySelector("#c_id")!.textContent = id;
  document.querySelector("#c_section")!.classList.remove("hidden");
}
