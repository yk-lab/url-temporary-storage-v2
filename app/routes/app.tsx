import { BackspaceIcon } from "@heroicons/react/24/solid";
import { json } from "@remix-run/cloudflare";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useRef } from "react";
import { z } from "zod";

import {
  filterByUser,
  insert,
  insertItemSchema,
  remove,
} from "~/features/items/services/items.server";
import { getAuthenticator } from "~/utils/auth.server";

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  // If the user is here, it's already authenticated, if not redirect them to
  // the login page.
  const auth = getAuthenticator(context);
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login?redirectTo=/app",
  });

  const items = await filterByUser(context, user);
  return json({ user, items });
};

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const payload = Object.fromEntries(await request.formData());

  const auth = getAuthenticator(context);
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login?redirectTo=/app",
  });

  const { action } = payload;

  if (action === "remove") {
    const id = z.string().uuid().parse(payload.id);
    await remove(context, id, user);
    return json({ ok: true, action: "remove" });
  }
  const item = await insert(
    context,
    insertItemSchema.parse({
      ...payload,
      id: crypto.randomUUID(),
      userId: user.id,
    }),
  );
  return json({ ok: true, action: "add", item }, { status: 201 });
};

export default function App() {
  const { user, items } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const formRef = useRef<HTMLFormElement>(null);
  const nameFieldRef = useRef<HTMLInputElement>(null);
  const urlFieldRef = useRef<HTMLInputElement>(null);
  const isNameManuallyChanged = useRef(false);

  useEffect(
    function resetFormOnSuccess() {
      if (
        navigation.state === "idle" &&
        actionData?.ok &&
        actionData?.action === "add"
      ) {
        formRef.current?.reset();
        isNameManuallyChanged.current = false;
        urlFieldRef.current?.focus();
      }
    },
    [navigation.state, actionData],
  );

  const getTitle = async (url: string) => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function (ev) {
        const title = this.responseXML?.title || "no title";
        console.log(this.responseXML, ev, title);
        resolve(title);
      };
      xhr.onerror = function (ev) {
        reject(ev);
      };
      xhr.open("GET", url, true);
      xhr.responseType = "document";
      xhr.send();
    });
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    isNameManuallyChanged.current = true;
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    if (!url) return;
    if (!nameFieldRef.current || isNameManuallyChanged.current) return;
    getTitle(url).then((title) => {
      nameFieldRef.current!.value = title;
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="flex flex-wrap">
          <h1 className="text-2xl font-semibold text-clip">
            Welcome {user.name}
          </h1>
          <Link
            to="/logout"
            className="ml-auto text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
          >
            Logout
          </Link>
        </div>
        <Form ref={formRef} method="post">
          <h2 className="sr-only">Add Item</h2>
          <div className="mt-10 flex flex-col sm:flex-row gap-x-6 gap-y-8">
            <div className="relative flex-1">
              <label
                htmlFor="name"
                className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900"
              >
                Name
              </label>
              <input
                ref={nameFieldRef}
                type="text"
                name="name"
                id="name"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
                onChange={handleNameChange}
              />
            </div>
            <div className="relative flex-1">
              <label
                htmlFor="url"
                className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900"
              >
                URL
              </label>
              <input
                ref={urlFieldRef}
                type="url"
                name="url"
                id="url"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
                onChange={handleUrlChange}
              />
            </div>
            <div className="flex items-center justify-start gap-x-6 sm:flex-none">
              <button
                type="submit"
                name="action"
                value="add"
                className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                Save
              </button>
            </div>
          </div>
        </Form>
        <div>
          <h2 className="sr-only">Your Items</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-x-6 rounded-md bg-white px-6 py-4 shadow"
              >
                <div className="relative flex-auto min-w-0">
                  <h3 className="text-sm font-semibold leading-6 text-gray-900 truncate hover:text-clip">
                    {item.name || "no name"}
                  </h3>
                  <a
                    className="decoration-gray-500 hover:underline truncate hover:text-clip mt-1 flex text-xs leading-5 text-gray-500"
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    {item.url}
                  </a>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                  <Form method="post">
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      name="action"
                      value="remove"
                      className="py-2"
                    >
                      <BackspaceIcon
                        className="h-5 w-5 text-red-600"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Remove</span>
                    </button>
                  </Form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
