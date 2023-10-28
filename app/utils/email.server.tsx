import { renderToString } from "react-dom/server";

import * as emailProvider from "./email-provider.server";

import type { AppLoadContext } from "@remix-run/cloudflare";
import type { SendEmailFunction } from "remix-auth-email-link";

import type { User } from "~/features/users/services/users.server";

const notFoundUserEmail = (options: {
  emailAddress: string;
  magicLink: string;
  domainUrl: string;
}) => {
  const signupUrl = `${options.domainUrl}/signup`;
  const subject = "ユーザーが見つかりませんでした";
  const body = renderToString(
    <>
      <p>ご利用ありがとうございます。</p>
      <p>
        以下のメールアドレスで登録されているユーザーが見つかりませんでした。
        <br />
        <br />
        {options.emailAddress}
      </p>

      <p>
        ご登録を希望する場合は、以下のリンクをクリックして新規登録をお願いします。
        <br />
        <br />
        <a href={signupUrl}>{signupUrl}</a>
      </p>

      <p>
        心当たりがない場合は、このメールを無視してください。
        <br />
        <br />
        何かご不明な点があれば、お気軽にご連絡ください。
      </p>
    </>,
  );
  return { subject, body };
};

const magicLinkEmail = (options: {
  emailAddress: string;
  magicLink: string;
  user?: User | null;
  domainUrl: string;
  form: FormData;
}) => {
  const subject = "ログインURL";
  const body = renderToString(
    <>
      <p>
        ご利用ありがとうございます。ログインするには、以下のリンクをクリックしてください。
        <br />
        <br />
        <a href={options.magicLink}>{options.magicLink}</a>
      </p>
      <p>
        ログインリンクは30分間有効です。
        <br />
        <br />
        何かご不明な点があれば、お気軽にご連絡ください。
      </p>
    </>,
  );
  return { subject, body };
};

export const sendLoginEmail = (
  context: AppLoadContext,
): SendEmailFunction<User> => {
  return async (options: {
    emailAddress: string;
    magicLink: string;
    user?: User | null;
    domainUrl: string;
    form: FormData;
  }) => {
    const { subject, body } = options.user
      ? magicLinkEmail(options)
      : notFoundUserEmail(options);
    await emailProvider.sendEmail(context, options.emailAddress, subject, body);
  };
};

const alreadyRegisteredEmail = (options: {
  emailAddress: string;
  domainUrl: string;
}) => {
  const loginUrl = `${options.domainUrl}/login`;
  const subject = "既に登録されています";
  const body = renderToString(
    <>
      <p>ご利用ありがとうございます。</p>
      <p>
        以下のメールアドレスは既に登録されています。
        <br />
        <br />
        {options.emailAddress}
      </p>

      <p>
        以下のリンクをクリックして改めてログインをお願いします。
        <br />
        <br />
        <a href={loginUrl}>{loginUrl}</a>
      </p>

      <p>何かご不明な点があれば、お気軽にご連絡ください。</p>
    </>,
  );
  return { subject, body };
};

const signupEmail = (options: {
  emailAddress: string;
  registrationLink: string;
}) => {
  const subject = "新規登録URL";
  const body = renderToString(
    <>
      <p>
        ご利用ありがとうございます。新規登録するには、以下のリンクをクリックしてください。
        <br />
        <br />
        <a href={options.registrationLink}>{options.registrationLink}</a>
      </p>
      <p>
        新規登録リンクは30分間有効です。
        <br />
        <br />
        何かご不明な点があれば、お気軽にご連絡ください。
      </p>
    </>,
  );
  return { subject, body };
};

export const sendSignupEmail = (context: AppLoadContext) => {
  return async (options: {
    emailAddress: string;
    registrationLink: string;
    user?: User | null;
    domainUrl: string;
  }) => {
    const { subject, body } = options.user
      ? alreadyRegisteredEmail(options)
      : signupEmail(options);
    await emailProvider.sendEmail(context, options.emailAddress, subject, body);
  };
};

const signupCompleteEmail = (options: {
  emailAddress: string;
  domainUrl: string;
}) => {
  const loginUrl = `${options.domainUrl}/login`;
  const subject = "新規登録完了";
  const body = renderToString(
    <>
      <p>ご利用ありがとうございます。</p>
      <p>
        以下のメールアドレスで新規登録が完了しました。
        <br />
        <br />
        {options.emailAddress}
      </p>

      <p>
        以下のリンクをクリックしてログインをお願いします。
        <br />
        <br />
        <a href={loginUrl}>{loginUrl}</a>
      </p>

      <p>何かご不明な点があれば、お気軽にご連絡ください。</p>
    </>,
  );
  return { subject, body };
};

export const sendSignupCompleteEmail = (context: AppLoadContext) => {
  return async (options: { emailAddress: string; domainUrl: string }) => {
    const { subject, body } = signupCompleteEmail(options);
    await emailProvider.sendEmail(context, options.emailAddress, subject, body);
  };
};
