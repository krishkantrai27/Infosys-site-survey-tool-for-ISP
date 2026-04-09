import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbTest {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/site", "root", "root123");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT id, name, plan_file_id FROM floors");
        while(rs.next()) {
            System.out.println("Floor ID: " + rs.getInt("id") + ", Name: " + rs.getString("name") + ", Plan File ID: " + rs.getInt("plan_file_id") + " (wasNull: " + rs.wasNull() + ")");
        }
        conn.close();
    }
}
