<?php
/**
 * Response klass - Standardiserade API-svar
 */
class Response {
    /**
     * Skicka framgångsrikt svar
     */
    public static function success($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }
    
    /**
     * Skicka felsvar
     */
    public static function error($message, $statusCode = 400) {
        http_response_code($statusCode);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
    
    /**
     * Skicka svar med paginering
     */
    public static function paginated($data, $page, $perPage, $total) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => ceil($total / $perPage)
            ]
        ]);
        exit;
    }
}
