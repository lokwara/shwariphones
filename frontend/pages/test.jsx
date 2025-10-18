import { Button, Modal, NumberInput, TextInput } from "@mantine/core"
import React, { useCallback, useEffect, useState } from "react"
import axios from "axios"

function Test() {
  const [tx, setTx] = useState({
    amount: null,
    phone: null,
  })
  const [loading, setLoading] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentLink, setPaymentLink] = useState(null)
  const [webhookData, setWebhookData] = useState(null)

  const handleInitiateTx = async () => {
    setLoading(true)

    if (!paymentLink) {
      try {
        const { data } = await axios.post("/api/pesapal_create_request", tx, {
          headers: {
            "Content-Type": "application/json",
          },
        })

        setPaymentLink(data?.redirect_url)

        setPaymentModalOpen(true)
      } catch (err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    } else {
      setPaymentModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setPaymentModalOpen(false)
    setPaymentLink(null)
    setLoading(false)
  }

  const [data, setData] = useState(null)

  useEffect(() => {
    const eventSource = new EventSource("/api/webhook_test") // Adjust based on your API route

    eventSource.onmessage = (event) => {
      const receivedData = JSON.parse(event.data)
      console.log("Received:", receivedData)
      setData(receivedData)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <div className="p-12 space-y-8">
      <strong>Pesa Pal sandbox</strong>

      <NumberInput
        label="Amount"
        prefix="Ksh."
        thousandSeparator
        value={tx?.amount}
        onChange={(val) => setTx((prev) => ({ ...prev, amount: val }))}
      />

      <TextInput
        label="Phone number"
        value={tx?.phone}
        onChange={(e) => setTx((prev) => ({ ...prev, phone: e.target.value }))}
      />

      {tx?.amount && tx?.phone && (
        <Button
          onClick={handleInitiateTx}
          loading={loading}
          disabled={loading}
          fullWidth
        >
          Initiate TX
        </Button>
      )}

      <Modal centered opened={paymentModalOpen} onClose={handleCloseModal}>
        <iframe
          className="no-scrollbar border-none"
          src={paymentLink}
          width="100%"
          height="500px"
        />
      </Modal>
    </div>
  )
}

export default Test
