<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $number = htmlspecialchars($_POST['number']);
    $message = htmlspecialchars($_POST['message']);

    $data = array('number' => $number, 'message' => $message);
    $options = array(
        'http' => array(
            'header'  => "Content-type: application/json",
            'method'  => 'POST',
            'content' => json_encode($data)
        )
    );
    $context  = stream_context_create($options);
    $result = file_get_contents('http://localhost:3000/send', false, $context);
    if ($result === FALSE) { /* Handle error */ echo "Failed";}

    echo "Message sent!";
}
?>
