import { ADD_MAILING } from "@/lib/request";
import {
  Divider,
  NavLink,
  UnstyledButton,
  Input,
  Button,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import Image from "next/image";

import Link from "next/link";
import React, { useState } from "react";
import { useMutation } from "urql";

function Footer() {
  const [privacyPolicyOpen, setOpenPrivacyPolicy] = useState(false);
  const [termsOpen, setOpenTerms] = useState(false);
  const [returnsOpen, setOpenReturns] = useState(false);
  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState(false);

  const [_, _addMailing] = useMutation(ADD_MAILING);

  const handleSubscribe = () => {
    if (!mail) {
      notifications.show({
        title: "Enter email",
        color: "orange",
        message: "Enter an email to get informed about new deals and offers ",
      });
      return;
    }

    setLoading(false);

    _addMailing({
      email: mail,
    })
      .then(({ data, error }) => {
        if (data && !error) {
          notifications.show({
            title: "Subscribed",
            color: "green",
            icon: <IconCheck />,
          });
        }
      })
      .finally(() => {
        setMail("");
        setLoading(false);
      });
  };

  return (
    <div className="p-8 bg-blue-950">
      <div className="lg:flex lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <br />
          <p className="font-bold text-[1rem] text-white">Contact Us</p>
          <br />
          <div className="space-y-2">
            <p className="text-white">Suite 409 </p>
            <p className="text-white">
              4th Floor, Kimathi House, Kimathi Street{" "}
            </p>
            <p className="text-white">Nairobi , Kenya </p>
            <p className="text-white">info@shwariphones.africa </p>
            <p className="text-white">+254 705 820 082 </p>

            <br />
            <div className="flex space-x-6">
              <Link
                href="https://wa.link/qlxza9"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/socials/whatsapp.png"
                  alt="Whatsapp"
                  width={24}
                  height={24}
                  priority
                />
              </Link>

              <Link
                href="https://www.tiktok.com/@shwariphones"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/socials/tiktok.png"
                  alt="Tiktok"
                  width={24}
                  height={24}
                  priority
                />
              </Link>

              {/* <Link
                href="https://www.instagram.com/shwariphones/reels/"
                passHref
                legacyBehavior
              >
                <Image
                  src="/socials/ig.png"
                  alt="Instagram"
                  width={24}
                  height={24}
                  priority
                />
              </Link> */}

              <Link
                href="https://www.instagram.com/shwariphones/reels/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/socials/threads.png"
                  alt="Threads"
                  width={24}
                  height={24}
                  priority
                />
              </Link>

              <Link
                href="https://www.instagram.com/shwariphones/reels/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/socials/x.png"
                  alt="X"
                  width={24}
                  height={24}
                  priority
                />
              </Link>

              <Link
                href="https://www.youtube.com/@ShwariPhones"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/socials/yt.png"
                  alt="Youtube"
                  width={24}
                  height={24}
                  priority
                />
              </Link>
            </div>
          </div>
        </div>

        <div>
          <br />

          <p className="font-bold text-[1rem] text-white">Subscribe</p>
          <br />

          <p className="text-white">
            Get notifications on the latest deals and offers{" "}
          </p>
          <br />
          <Input
            placeholder="Email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />
          <br />

          <Button
            fullWidth
            color="yellow"
            loading={loading}
            disabled={loading}
            onClick={handleSubscribe}
          >
            <p className="text-slate-800">Get notified</p>
          </Button>
        </div>

        <div>
          <br />

          <p className="font-bold text-[1rem] text-white">Legal</p>

          <br />

          <div className="space-y-4">
            <a
              onClick={() => setOpenPrivacyPolicy(true)}
              className="text-white block hover:cursor-pointer underline"
            >
              Return & Refunds Policy
            </a>

            {/* Privacy policy */}
            <Modal
              centered
              opened={privacyPolicyOpen}
              onClose={() => setOpenPrivacyPolicy(false)}
              title={
                <strong className="text-[1.3rem] p-2">
                  Return & Refunds Policy
                </strong>
              }
            >
              <div className="space-y-2">
                <h2 className="font-bold">1. Return Policy</h2>
                <h3 className="italic">1.1 Eligibility for Returns</h3>
                <p>
                  <strong>Goods once sold cannot be returned!</strong>
                </p>
                <br />

                <h2 className="font-bold">2. Warranty Policy</h2>

                <h3 className="italic">2.1 Warranty Coverage</h3>
                <p>
                  Each preloved phone comes with a{" "}
                  <strong>6-month warranty</strong> against functional defects
                  not caused by user error or damage. This warranty covers only
                  software issues and does not include accessories.
                </p>

                <br />
                <h3 className="italic">2.2 Exclusions from Warranty</h3>
                <p>The warranty does not cover:</p>
                <ol>
                  <li className="text-[0.7rem]">
                    1. Damage caused by misuse, accidents, or unauthorized
                    repairs.
                  </li>
                  <li className="text-[0.7rem]">
                    2. Software issues or any damage related to third-party
                    applications.
                  </li>
                  <li className="text-[0.7rem]">3. Normal wear and tear.</li>
                </ol>

                <br />
                <h3 className="italic">2.3 Claiming Warranty Service</h3>
                <p>
                  To claim warranty service, please contact our customer service
                  at <strong>0705820082</strong> and provide:
                </p>
                <ul>
                  <li className="text-[0.7rem]">1. Your phone IMEI.</li>
                  <li className="text-[0.7rem]">
                    2. A description of the issue.
                  </li>
                  <li className="text-[0.7rem]">
                    3. Any relevant photos of the problem.
                  </li>
                </ul>
                <p>
                  We may require you to send the device to us for inspection.
                </p>

                <br />
                <h3 className="italic">2.4 Warranty Resolution</h3>
                <p>
                  If your device is found to be defective and covered by the
                  warranty, we will <strong>repair or replace</strong> the
                  device at our discretion. If repairs take longer than{" "}
                  <strong>72 hours</strong>, customers will be offered a
                  replacement or a full refund.
                </p>
                <br />

                <h2 className="font-bold">3. General Conditions</h2>

                <h3 className="italic">3.1 Changes to Policies</h3>
                <p>
                  We reserve the right to modify these terms and conditions at
                  any time. Any changes will be communicated to customers
                  through our website.
                </p>
              </div>
            </Modal>

            <br />
          </div>
        </div>
      </div>

      <br />
      <br />

      <div className="flex justify-center text-white">
        <p>Copyright ©  {new Date().getFullYear()} Shwariphones</p>
      </div>
    </div>
  );
}

export default Footer;
